import { BadRequestError, JSONObject, KDocument } from "kuzzle";
import { ask, onAsk } from "kuzzle-plugin-commons";
import _ from "lodash";

import {
  AskAssetHistoryAdd,
  AssetContent,
  AssetHistoryContent,
  AssetHistoryEventMeasure,
  AssetHistoryEventMetadata,
  AssetSerializer,
} from "../asset";
import { DeviceContent } from "../device";
import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import { BaseService, Metadata, keepStack, lock, objectDiff } from "../shared";

import { DecodedMeasurement, MeasureContent } from "./types/MeasureContent";
import {
  AskMeasureIngest,
  EventMeasurePersistBefore,
  EventMeasureProcessAfter,
  EventMeasureProcessBefore,
  TenantEventMeasurePersistBefore,
  TenantEventMeasureProcessAfter,
  TenantEventMeasureProcessBefore,
} from "./types/MeasureEvents";

export class MeasureService extends BaseService {
  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);

    onAsk<AskMeasureIngest>(
      "device-manager:measures:ingest",
      async (payload) => {
        await this.ingest(
          payload.device,
          payload.measurements,
          payload.metadata,
          payload.payloadUuids,
        );
      },
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
    payloadUuids: string[],
  ) {
    await lock(`measure:ingest:${device._id}`, async () => {
      if (!measurements) {
        this.app.log.warn(
          `Cannot find measurements for device "${device._source.reference}"`,
        );
        return;
      }

      const engineId = device._source.engineId;
      const asset = await this.tryGetLinkedAsset(
        engineId,
        device._source.assetId,
      );
      const originalAssetMetadata: Metadata =
        asset === null
          ? {}
          : JSON.parse(JSON.stringify(asset._source.metadata));

      _.merge(device._source.metadata, metadata);

      const measures = this.buildMeasures(
        device,
        asset,
        measurements,
        payloadUuids,
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
        { asset, device, measures },
      );

      if (engineId) {
        await this.app.trigger<TenantEventMeasureProcessBefore>(
          `engine:${engineId}:device-manager:measures:process:before`,
          { asset, device, measures },
        );
      }

      await this.updateDeviceMeasures(device, measures);

      let assetStates = new Map<number, KDocument<AssetContent>>();
      if (asset) {
        assetStates = await this.updateAssetMeasures(asset, measures);
      }

      await this.app.trigger<EventMeasurePersistBefore>(
        "device-manager:measures:persist:before",
        {
          asset,
          device,
          measures,
        },
      );

      if (engineId) {
        await this.app.trigger<TenantEventMeasurePersistBefore>(
          `engine:${engineId}:device-manager:measures:persist:before`,
          { asset, device, measures },
        );
      }

      const promises = [];

      promises.push(
        this.sdk.document
          .update<DeviceContent>(
            this.config.adminIndex,
            InternalCollection.DEVICES,
            device._id,
            device._source,
          )
          .catch((error) => {
            throw keepStack(
              error,
              new BadRequestError(
                `Cannot update device "${device._id}": ${error.message}`,
              ),
            );
          }),
      );

      if (engineId) {
        promises.push(
          this.sdk.document
            .update<DeviceContent>(
              engineId,
              InternalCollection.DEVICES,
              device._id,
              device._source,
            )
            .catch((error) => {
              throw keepStack(
                error,
                new BadRequestError(
                  `Cannot update engine device "${device._id}": ${error.message}`,
                ),
              );
            }),
        );

        promises.push(
          this.sdk.document
            .mCreate<MeasureContent>(
              engineId,
              InternalCollection.MEASURES,
              measures.map((measure) => ({ body: measure })),
            )
            .then(({ errors }) => {
              if (errors.length !== 0) {
                throw new BadRequestError(
                  `Cannot save measures: ${errors[0].reason}`,
                );
              }
            }),
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
                asset._source,
              )
              .catch((error) => {
                throw keepStack(
                  error,
                  new BadRequestError(
                    `Cannot update asset "${asset._id}": ${error.message}`,
                  ),
                );
              }),
          );

          promises.push(
            historizeAssetStates(
              assetStates,
              engineId,
              originalAssetMetadata,
              asset._source.metadata,
            ),
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
        },
      );

      if (engineId) {
        await this.app.trigger<TenantEventMeasureProcessAfter>(
          `engine:${engineId}:device-manager:measures:process:after`,
          { asset, device, measures },
        );
      }
    });
  }

  private updateDeviceMeasures(
    device: KDocument<DeviceContent>,
    measurements: MeasureContent[],
  ) {
    if (!device._source.measures) {
      device._source.measures = {};
    }

    let lastMeasuredAt = 0;

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

      if (measurement.measuredAt > lastMeasuredAt) {
        lastMeasuredAt = measurement.measuredAt;
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

    device._source.lastMeasuredAt = lastMeasuredAt;
  }

  // @todo there shouldn't be any logic related to asset historization here, but no other choices for now. It needs to be re-architected
  /**
   * Update asset with each non-null non-computed measures.
   *
   * @returns A map of each asset state by measuredAt timestamp.
   */
  private updateAssetMeasures(
    asset: KDocument<AssetContent>,
    measurements: MeasureContent[],
  ): Map<number, KDocument<AssetContent<any, any>>> {
    // We use a Map in order to preserve the insertion order to avoid another sort
    const assetStates = new Map<number, KDocument<AssetContent>>();

    if (!asset._source.measures) {
      asset._source.measures = {};
    }

    let lastMeasuredAt = 0;

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

      if (measurement.measuredAt > lastMeasuredAt) {
        lastMeasuredAt = measurement.measuredAt;
      }

      asset._source.measures[measureName] = {
        measuredAt: measurement.measuredAt,
        name: measureName,
        originId: measurement.origin._id,
        payloadUuids: measurement.origin.payloadUuids,
        type: measurement.type,
        values: measurement.values,
      };

      assetStates.set(
        measurement.measuredAt,
        JSON.parse(JSON.stringify(asset)),
      );
    }

    asset._source.lastMeasuredAt = lastMeasuredAt;

    return assetStates;
  }

  /**
   * Build the measures documents to save
   */
  private buildMeasures(
    device: KDocument<DeviceContent>,
    asset: KDocument<AssetContent> | null,
    measurements: DecodedMeasurement[],
    payloadUuids: string[],
  ): MeasureContent[] {
    const measures: MeasureContent[] = [];

    for (const measurement of measurements) {
      // @todo check if measure type exists
      const assetMeasureName = this.tryFindAssetMeasureName(
        device,
        asset,
        measurement.measureName,
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
          deviceMetadata: device._source.metadata,
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

    return measures.sort(
      (measureA, measureB) => measureA.measuredAt - measureB.measuredAt,
    );
  }

  private async tryGetLinkedAsset(
    engineId: string,
    assetId: string,
  ): Promise<KDocument<AssetContent>> {
    if (!assetId) {
      return null;
    }

    try {
      const asset = await this.sdk.document.get<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        assetId,
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
    deviceMeasureName: string,
  ): string | null {
    if (!asset) {
      return null;
    }

    const deviceLink = asset._source.linkedDevices.find(
      (link) => link._id === device._id,
    );

    if (!deviceLink) {
      throw new BadRequestError(
        `Device "${device._id}" is not linked to asset "${asset._id}"`,
      );
    }

    const measureName = deviceLink.measureNames.find(
      (m) => m.device === deviceMeasureName,
    );
    // The measure is decoded by the device but is not linked to the asset
    if (!measureName) {
      return null;
    }

    return measureName.asset;
  }
}

/**
 * Create a new document in the collection asset-history, for each asset states
 */
async function historizeAssetStates(
  assetStates: Map<number, KDocument<AssetContent<any, any>>>,
  engineId: string,
  originalAssetMetadata: Metadata,
  assetMetadata: Metadata,
): Promise<void> {
  const metadataChanges = objectDiff(originalAssetMetadata, assetMetadata);
  const lastTimestampRecorded = Array.from(assetStates.keys()).pop();

  const histories: AssetHistoryContent[] = [];
  for (const [measuredAt, assetState] of assetStates) {
    const measureNames = [];

    for (const measure of Object.values(assetState._source.measures)) {
      if (measure?.measuredAt === measuredAt) {
        measureNames.push(measure.name);
      }
    }

    const event: AssetHistoryEventMeasure = {
      measure: {
        names: measureNames,
      },
      name: "measure",
    };

    assetState._source.metadata = originalAssetMetadata;

    if (metadataChanges.length !== 0 && measuredAt === lastTimestampRecorded) {
      (event as unknown as AssetHistoryEventMetadata).metadata = {
        names: metadataChanges,
      };

      assetState._source.metadata = assetMetadata;
    }

    histories.push({
      asset: assetState._source,
      event,
      id: assetState._id,
      timestamp: measuredAt,
    });
  }

  return ask<AskAssetHistoryAdd<AssetHistoryEventMeasure>>(
    "ask:device-manager:asset:history:add",
    {
      engineId,
      // Reverse order because for now, measuredAt are sorted in ascending order
      // While in mCreate the last item will be the first document to be created
      histories: histories.reverse(),
    },
  );
}
