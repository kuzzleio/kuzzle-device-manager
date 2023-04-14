import {
  Backend,
  BadRequestError,
  JSONObject,
  KDocument,
  PluginContext,
} from "kuzzle";
import _ from "lodash";

import {
  DeviceManagerConfiguration,
  DeviceManagerPlugin,
  InternalCollection,
} from "../plugin";
import { DeviceContent } from "../device";
import {
  AskAssetHistoryAdd,
  AssetContent,
  AssetHistoryEventMeasure,
  AssetHistoryEventMetadata,
} from "../asset";
import { Metadata, lock, ask, onAsk, keepStack, objectDiff } from "../shared";
import { AssetSerializer } from "../asset";

import {
  AskMeasureIngest,
  EventMeasureProcessAfter,
  EventMeasureProcessBefore,
  TenantEventMeasureProcessAfter,
  TenantEventMeasureProcessBefore,
} from "./types/MeasureEvents";
import { DecodedMeasurement, MeasureContent } from "./types/MeasureContent";

export class MeasureService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  private get app(): Backend {
    return global.app;
  }

  constructor(plugin: DeviceManagerPlugin) {
    this.config = plugin.config as any;
    this.context = plugin.context;

    onAsk<AskMeasureIngest>(
      "device-manager:measures:ingest",
      async (payload) => {
        await this.ingest(
          payload.device,
          payload.measurements,
          payload.metadata,
          payload.payloadUuids
        );
      }
    );
  }

  /**
   * Register new measures from a device, updates :
   * - admin device
   * - engine device
   * - linked asset
   * - engine measures
   *
   * A mutex ensure that a device can ingest one measure at a time.
   *
   * This method represents the ingestion pipeline:
   *  - build measures documents and update digital twins (device and asset)
   *  - trigger events `before` (measure enrichment)
   *  - save documents (measures, device and asset)
   *  - trigger events `after`
   */
  public async ingest(
    device: KDocument<DeviceContent>,
    measurements: DecodedMeasurement<JSONObject>[],
    metadata: Metadata,
    payloadUuids: string[]
  ) {
    await lock(`measure:ingest:${device._id}`, async () => {
      if (!measurements) {
        this.app.log.warn(
          `Cannot find measurements for device "${device._source.reference}"`
        );
        return;
      }

      const engineId = device._source.engineId;
      const asset = await this.tryGetLinkedAsset(
        engineId,
        device._source.assetId
      );
      const originalAssetMetadata =
        asset === null
          ? {}
          : JSON.parse(JSON.stringify(asset._source.metadata));

      _.merge(device._source.metadata, metadata);

      const measures = this.buildMeasures(
        device,
        asset,
        measurements,
        payloadUuids
      );

      if (asset) {
        asset._source.measures ||= {};
      }

      /**
       * Event before starting to process new measures.
       *
       * Useful to enrich measures before they are saved.
       */
      await this.app.trigger<EventMeasureProcessBefore>(
        "device-manager:measures:process:before",
        { asset, device, measures }
      );

      if (engineId) {
        await this.app.trigger<TenantEventMeasureProcessBefore>(
          `engine:${engineId}:device-manager:measures:process:before`,
          { asset, device, measures }
        );
      }

      await this.updateDeviceMeasures(device, measures);
      if (asset) {
        await this.updateAssetMeasures(asset, measures);
      }

      const promises = [];

      promises.push(
        this.sdk.document
          .update<DeviceContent>(
            this.config.adminIndex,
            InternalCollection.DEVICES,
            device._id,
            device._source
          )
          .catch((error) => {
            throw keepStack(
              error,
              new BadRequestError(
                `Cannot update device "${device._id}": ${error.message}`
              )
            );
          })
      );

      if (engineId) {
        promises.push(
          this.sdk.document
            .update<DeviceContent>(
              engineId,
              InternalCollection.DEVICES,
              device._id,
              device._source
            )
            .catch((error) => {
              throw keepStack(
                error,
                new BadRequestError(
                  `Cannot update engine device "${device._id}": ${error.message}`
                )
              );
            })
        );

        promises.push(
          this.sdk.document
            .mCreate<MeasureContent>(
              engineId,
              InternalCollection.MEASURES,
              measures.map((measure) => ({ body: measure }))
            )
            .then(({ errors }) => {
              if (errors.length !== 0) {
                throw new BadRequestError(
                  `Cannot save measures: ${errors[0].reason}`
                );
              }
            })
        );

        if (asset) {
          // @todo potential race condition if 2 differents device are linked
          // to the same asset and get processed at the same time
          // asset measures update could be protected by mutex
          promises.push(
            this.sdk.document
              .update<AssetContent>(
                engineId,
                InternalCollection.ASSETS,
                asset._id,
                asset._source
              )
              .then(async (updatedAsset) => {
                const event: AssetHistoryEventMeasure = {
                  measure: {
                    // Filter measures who are not in the asset device link
                    names: measures
                      .filter((m) => Boolean(m.asset?.measureName))
                      .map((m) => m.asset?.measureName),
                  },
                  name: "measure",
                };

                const changes = objectDiff(
                  originalAssetMetadata,
                  updatedAsset._source.metadata
                );
                if (changes.length !== 0) {
                  (event as unknown as AssetHistoryEventMetadata).metadata = {
                    names: changes,
                  };
                }

                await ask<AskAssetHistoryAdd<AssetHistoryEventMeasure>>(
                  "ask:device-manager:asset:history:add",
                  { asset: updatedAsset, engineId, event }
                );
              })
              .catch((error) => {
                throw keepStack(
                  error,
                  new BadRequestError(
                    `Cannot update asset "${asset._id}": ${error.message}`
                  )
                );
              })
          );
        }
      }

      await Promise.all(promises);

      /**
       * Event at the end of the measure process pipeline.
       *
       * Useful to trigger business rules like alerts
       *
       * @todo test this
       */
      await this.app.trigger<EventMeasureProcessAfter>(
        "device-manager:measures:process:after",
        {
          asset,
          device,
          measures,
        }
      );

      if (engineId) {
        await this.app.trigger<TenantEventMeasureProcessAfter>(
          `engine:${engineId}:device-manager:measures:process:after`,
          { asset, device, measures }
        );
      }
    });
  }

  private updateDeviceMeasures(
    device: KDocument<DeviceContent>,
    measurements: MeasureContent[]
  ) {
    if (!device._source.measures) {
      device._source.measures = {};
    }

    for (const measurement of measurements) {
      if (measurement.origin.type === "computed") {
        continue;
      }

      const measureName = measurement.origin.measureName;
      const previousMeasure = device._source.measures[measureName];

      if (
        previousMeasure &&
        previousMeasure.measuredAt >= measurement.measuredAt
      ) {
        continue;
      }

      device._source.measures[measureName] = {
        measuredAt: measurement.measuredAt,
        name: measureName,
        originId: measurement.origin._id,
        payloadUuids: measurement.origin.payloadUuids,
        type: measurement.type,
        values: measurement.values,
      };
    }
  }

  private updateAssetMeasures(
    asset: KDocument<AssetContent>,
    measurements: MeasureContent[]
  ) {
    if (!asset._source.measures) {
      asset._source.measures = {};
    }

    for (const measurement of measurements) {
      if (measurement.origin.type === "computed") {
        continue;
      }

      if (measurement.asset === null) {
        continue;
      }

      const measureName = measurement.asset.measureName;
      // The measurement was not present in the asset device links so it should
      // not be saved in the asset measures
      if (measureName === null) {
        continue;
      }
      const previousMeasure = asset._source.measures[measureName];

      if (
        previousMeasure &&
        previousMeasure.measuredAt >= measurement.measuredAt
      ) {
        continue;
      }

      asset._source.measures[measureName] = {
        measuredAt: measurement.measuredAt,
        name: measureName,
        originId: measurement.origin._id,
        payloadUuids: measurement.origin.payloadUuids,
        type: measurement.type,
        values: measurement.values,
      };
    }
  }

  /**
   * Build the measures documents to save
   */
  private buildMeasures(
    device: KDocument<DeviceContent>,
    asset: KDocument<AssetContent> | null,
    measurements: DecodedMeasurement[],
    payloadUuids: string[]
  ): MeasureContent[] {
    const measures: MeasureContent[] = [];

    for (const measurement of measurements) {
      // @todo check if measure type exists
      const assetMeasureName = this.tryFindAssetMeasureName(
        device,
        asset,
        measurement.measureName
      );

      const assetContext =
        asset === null || assetMeasureName === null
          ? null
          : AssetSerializer.measureContext(asset, assetMeasureName);

      const measureContent: MeasureContent = {
        asset: assetContext,
        measuredAt: measurement.measuredAt,
        origin: {
          _id: device._id,
          deviceModel: device._source.model,
          measureName: measurement.measureName,
          payloadUuids,
          reference: device._source.reference,
          type: "device",
        },
        type: measurement.type,
        values: measurement.values,
      };

      measures.push(measureContent);
    }

    return measures;
  }

  private async tryGetLinkedAsset(
    engineId: string,
    assetId: string
  ): Promise<KDocument<AssetContent>> {
    if (!assetId) {
      return null;
    }

    try {
      const asset = await this.sdk.document.get<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        assetId
      );

      return asset;
    } catch (error) {
      this.app.log.error(`[${engineId}] Cannot find asset "${assetId}".`);

      return null;
    }
  }

  /**
   * Retrieve the measure name for the asset
   */
  private tryFindAssetMeasureName(
    device: KDocument<DeviceContent>,
    asset: KDocument<AssetContent>,
    deviceMeasureName: string
  ): string | null {
    if (!asset) {
      return null;
    }

    const deviceLink = asset._source.linkedDevices.find(
      (link) => link._id === device._id
    );

    if (!deviceLink) {
      throw new BadRequestError(
        `Device "${device._id}" is not linked to asset "${asset._id}"`
      );
    }

    const measureName = deviceLink.measureNames.find(
      (m) => m.device === deviceMeasureName
    );
    // The measure is decoded by the device but is not linked to the asset
    if (!measureName) {
      return null;
    }

    return measureName.asset;
  }
}
