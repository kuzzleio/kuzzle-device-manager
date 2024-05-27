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
  AskMeasureSourceIngest,
  EventMeasurePersistBefore,
  EventMeasurePersistSourceBefore,
  EventMeasureProcessAfter,
  EventMeasureProcessBefore,
  EventMeasureProcessSourceAfter,
  EventMeasureProcessSourceBefore,
  TenantEventMeasurePersistBefore,
  TenantEventMeasurePersistSourceBefore,
  TenantEventMeasureProcessAfter,
  TenantEventMeasureProcessBefore,
  TenantEventMeasureProcessSourceAfter,
  TenantEventMeasureProcessSourceBefore,
} from "./types/MeasureEvents";
import { APIMeasureSource, isSourceAPI } from "./types/MeasureSources";
import { apiSourceToOriginApi, toDeviceSource } from "./MeasureSourcesBuilder";
import { AskModelAssetGet } from "../model";

export class MeasureService extends BaseService {
  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);

    onAsk<AskMeasureSourceIngest>(
      "device-manager:measures:sourceIngest",

      async (payload) => {
        if (!payload) {
          return;
        }

        if (isSourceAPI(payload.source)) {
          await this.ingestAPI(
            payload.source,
            payload.measurements,
            payload.payloadUuids,
          );
        }
      },
    );

    onAsk<AskMeasureIngest>(
      "device-manager:measures:ingest",
      async (payload) => {
        if (!payload) {
          return;
        }

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
   * Register new measure from an API, updates :
   * - asset
   * - engine measures
   *
   * This method represents the ingestion pipeline:
   *  - trigger events `before` (measure enrichment)
   *  - save documents (measures and asset)
   *  - trigger events `after`
   */
  public async ingestAPI(
    source: APIMeasureSource,
    measurements: DecodedMeasurement<JSONObject>[],
    payloadUuids: string[],
  ) {
    const { dataSourceId: sourceId, targetIndexId, targetAssetId } = source;

    if (!measurements) {
      this.app.log.warn(
        `No measurements provided for "${sourceId}" API measures ingest`,
      );
      return;
    }

    const assetDocument = await this.findAsset(targetIndexId, targetAssetId);

    if (!assetDocument) {
      throw new BadRequestError(
        `"${source.targetAssetId}" is not a valid target asset ID`,
      );
    }

    const { _id: assetId, _source: asset } = assetDocument;

    const originalAssetMetadata: Metadata = asset
      ? JSON.parse(JSON.stringify(asset.metadata))
      : null;

    const measures = await this.buildAPIMeasures(
      source,
      assetDocument,
      measurements,
      payloadUuids,
    );

    if (asset) {
      asset.measures ||= {};
    }

    /**
     * Event before starting to process new measures.
     *
     * Useful to enrich measures before they are saved.
     */
    await this.app.trigger<EventMeasureProcessSourceBefore>(
      "device-manager:measures:process:sourceBefore",
      { asset, measures, source },
    );

    if (targetIndexId) {
      await this.app.trigger<TenantEventMeasureProcessSourceBefore>(
        `engine:${targetIndexId}:device-manager:measures:process:sourceBefore`,
        { asset, measures, source },
      );
    }

    let assetStates = new Map<number, KDocument<AssetContent>>();
    if (asset) {
      assetStates = this.updateAssetMeasures(assetDocument, measures);
    }

    await this.app.trigger<EventMeasurePersistSourceBefore>(
      "device-manager:measures:persist:sourceBefore",
      {
        asset,
        measures,
        source,
      },
    );

    if (targetIndexId) {
      await this.app.trigger<TenantEventMeasurePersistSourceBefore>(
        `engine:${targetIndexId}:device-manager:measures:persist:sourceBefore`,
        { asset, measures, source },
      );
    }

    const promises: Promise<any>[] = [];

    if (targetIndexId) {
      promises.push(
        this.sdk.document
          .mCreate<MeasureContent>(
            targetIndexId,
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
              targetIndexId,
              InternalCollection.ASSETS,
              assetId,
              asset,
            )
            .catch((error) => {
              throw keepStack(
                error,
                new BadRequestError(
                  `Cannot update asset "${assetId}": ${error.message}`,
                ),
              );
            }),
        );

        promises.push(
          historizeAssetStates(
            assetStates,
            targetIndexId,
            originalAssetMetadata,
            asset.metadata,
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
    await this.app.trigger<EventMeasureProcessSourceAfter>(
      "device-manager:measures:process:sourceAfter",
      {
        asset,
        measures,
        source,
      },
    );

    if (targetIndexId) {
      await this.app.trigger<TenantEventMeasureProcessSourceAfter>(
        `engine:${targetIndexId}:device-manager:measures:process:sourceAfter`,
        { asset, measures, source },
      );
    }
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
   *
   * @deprecated
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

      const { engineId, reference, model, assetId, lastMeasuredAt } =
        device._source;

      const asset = assetId ? await this.findAsset(engineId, assetId) : null;
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

      const source = toDeviceSource(
        device._id,
        reference,
        model,
        assetId ?? "",
        engineId,
        device._source.metadata,
        lastMeasuredAt,
      );

      /**
       * Event before starting to process new measures.
       *
       * Useful to enrich measures before they are saved.
       */
      await this.app.trigger<EventMeasureProcessBefore>(
        "device-manager:measures:process:before",
        { asset, device, measures, source },
      );

      if (engineId) {
        await this.app.trigger<TenantEventMeasureProcessBefore>(
          `engine:${engineId}:device-manager:measures:process:before`,
          { asset, device, measures, source },
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
          source,
        },
      );

      if (engineId) {
        await this.app.trigger<TenantEventMeasurePersistBefore>(
          `engine:${engineId}:device-manager:measures:persist:before`,
          { asset, device, measures, source },
        );
      }

      const promises: Promise<any>[] = [];

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
          source,
        },
      );

      if (engineId) {
        await this.app.trigger<TenantEventMeasureProcessAfter>(
          `engine:${engineId}:device-manager:measures:process:after`,
          { asset, device, measures, source },
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

      const measureName = measurement.asset?.measureName ?? null;
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
   * Build the measures document received from the API
   *
   * @param source The API data source
   * @param asset The target asset to build the measure for
   * @param measure The decoded raw measures
   * @param payloadUuids The uuid's of the payloads used to create the measure
   *
   * @returns A MeasurementContent builded from parameters
   */
  private async buildAPIMeasures(
    source: APIMeasureSource,
    asset: KDocument<AssetContent>,
    measures: DecodedMeasurement[],
    payloadUuids: string[],
  ): Promise<MeasureContent[]> {
    const apiMeasures: MeasureContent[] = [];

    for (const measure of measures) {
      let assetContext = null;
      const assetMeasureName = await this.findAssetMeasureNameFromModel(
        measure.measureName,
        asset._source.model,
      );

      if (assetMeasureName) {
        assetContext = AssetSerializer.measureContext(asset, assetMeasureName);
      }

      const measureSource = apiSourceToOriginApi(
        source,
        measure.measureName,
        payloadUuids,
      );

      apiMeasures.push({
        asset: assetContext,
        measuredAt: measure.measuredAt,
        origin: measureSource,
        type: measure.type,
        values: measure.values,
      });
    }

    return apiMeasures;
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
      let assetContext = null;
      if (asset) {
        const assetMeasureName = this.findAssetMeasureNameFromDevice(
          device._id,
          measurement.measureName,
          asset._source,
        );

        if (assetMeasureName) {
          assetContext = AssetSerializer.measureContext(
            asset,
            assetMeasureName,
          );
        }
      }

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

    return measures.sort(
      (measureA, measureB) => measureA.measuredAt - measureB.measuredAt,
    );
  }

  /**
   * Find an asset by its ID and its engine ID.
   *
   * @param engineId The target index ID
   * @param assetId the target asset ID
   * @returns The asset or null if not found
   */
  private async findAsset(
    engineId: string,
    assetId: string,
  ): Promise<KDocument<AssetContent> | null> {
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
   * Find the asset measure name from the asset model and its measure type
   *
   * @param measureType The target measure type
   * @param model The asset model the measureName belong
   *
   * @returns The asset measure name or null if it does not belong to the link
   * @throws If the model does not exists
   */
  private async findAssetMeasureNameFromModel(
    measureType: string,
    model: string,
  ): Promise<string | null> {
    const assetModel = await ask<AskModelAssetGet>(
      "ask:device-manager:model:asset:get",
      {
        engineGroup: "commons",
        model: model,
      },
    );

    if (!assetModel) {
      throw new BadRequestError(`Model "${model}" does not exists`);
    }

    const assetMeasureName = assetModel.asset.measures.find(
      (m) => m.name === measureType,
    );

    return assetMeasureName?.name ?? null;
  }

  /**
   * Find the asset measure name from the device and its measure type
   *
   * @param deviceId The source device ID
   * @param measureType The device measure type
   * @param asset The asset the device is linked to
   *
   * @returns The asset measure name or null if it does not belong to the link
   * @throws If the device is not linked to the asset
   */
  private findAssetMeasureNameFromDevice(
    deviceId: string,
    measureType: string,
    asset: AssetContent,
  ): string | null {
    const linkedDevice = asset.linkedDevices.find(
      (link) => link._id === deviceId,
    );

    if (!linkedDevice) {
      throw new BadRequestError(
        `Device "${deviceId}" is not linked to "${asset.model}" asset: "${asset.reference}"`,
      );
    }

    const assetMeasureName = linkedDevice.measureNames.find(
      (m) => m.device === measureType,
    );

    return assetMeasureName?.asset ?? null;
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
