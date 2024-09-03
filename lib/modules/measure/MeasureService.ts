import { BadRequestError, JSONObject, KDocument } from "kuzzle";
import { ask, onAsk } from "kuzzle-plugin-commons";
import _ from "lodash";

import {
  AskAssetHistoryAdd,
  AssetContent,
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
   * Register new measures from a device, updates:
   * - if their respective metadata has changed:
   *   - admin device
   *   - engine device
   *   - linked asset
   * - engine measures
   *
   * A mutex ensure that a device can ingest one measure at a time.
   *
   * This method represents the ingestion pipeline:
   *  - build measures documents and update digital twins (device and asset)
   *  - trigger events `before` (measure enrichment)
   *  - save documents (measures; device and asset if their respective metadata changed)
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

      const originalDeviceMetadata: Metadata = JSON.parse(
        JSON.stringify(device._source.metadata),
      );

      _.merge(device._source.metadata, metadata);

      const measures = this.buildMeasures(
        device,
        asset,
        measurements,
        payloadUuids,
      );

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

      const deviceMetadataChanges = objectDiff(
        originalDeviceMetadata,
        device._source.metadata,
      );

      const promises = [];

      if (deviceMetadataChanges.length > 0) {
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
      }

      if (engineId) {
        if (deviceMetadataChanges.length > 0) {
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
        }

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
          // Historize any change in metadata
          const assetMetadataChanges = objectDiff(
            originalAssetMetadata,
            asset._source.metadata,
          );

          if (assetMetadataChanges.length > 0) {
            // @todo potential race condition if 2 differents device are linked
            // to the same asset and get processed at the same time
            // asset measures update could be protected by mutex
            promises.push(
              this.sdk.document
                .update<AssetContent>(
                  engineId,
                  InternalCollection.ASSETS,
                  asset._id,
                  {
                    metadata: asset._source.metadata,
                  },
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
              ask<AskAssetHistoryAdd<AssetHistoryEventMetadata>>(
                "ask:device-manager:asset:history:add",
                {
                  engineId,
                  histories: [
                    {
                      asset: asset._source,
                      event: {
                        metadata: {
                          names: assetMetadataChanges,
                        },
                        name: "metadata",
                      },
                      id: asset._id,
                      timestamp: Date.now(),
                    },
                  ],
                },
              ),
            );
          }
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
