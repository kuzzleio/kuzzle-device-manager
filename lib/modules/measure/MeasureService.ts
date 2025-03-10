import { BadRequestError, JSONObject, KDocument } from "kuzzle";
import { ask, onAsk } from "kuzzle-plugin-commons";
import { AssetContent, AssetSerializer } from "../asset";

import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import { BaseService } from "../shared";

import { DecodedMeasurement, MeasureContent } from "./types/MeasureContent";
import {
  AskMeasureSourceIngest,
  EventMeasureProcessAfter,
  EventMeasureProcessBefore,
  TenantEventMeasureProcessAfter,
  TenantEventMeasureProcessBefore,
} from "./types/MeasureEvents";
import {
  ApiMeasureSource,
  DeviceMeasureSource,
  isSourceApi,
  isSourceDevice,
  MeasureSource,
} from "./types/MeasureSources";
import {
  apiSourceToOriginApi,
  deviceSourceToOriginDevice,
} from "./MeasureSourcesBuilder";
import { AskModelAssetGet } from "../model";
import {
  isTargetApi,
  isTargetDevice,
  MeasureTarget,
} from "./types/MeasureTarget";
import { merge } from "lodash";

export class MeasureService extends BaseService {
  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);

    onAsk<AskMeasureSourceIngest>(
      "device-manager:measures:sourceIngest",

      async (payload) => {
        if (!payload) {
          return;
        }

        const { target, measurements, source, payloadUuids } = payload;

        await this.ingest(source, target, measurements, payloadUuids);
      },
    );
  }

  /**
   * Register new measures updates :
   * - asset
   * - engine measures
   *
   * This method represents the ingestion pipeline:
   *  - trigger events `before` (measure enrichment)
   *  - save documents (measures & device metadata)
   *  - trigger events `after`
   */
  public async ingest(
    source: MeasureSource,
    target: MeasureTarget,
    measurements: DecodedMeasurement<JSONObject>[],
    payloadUuids: string[],
  ) {
    const { id: dataSourceId } = source;
    const { indexId, assetId } = target;

    if (!measurements) {
      this.app.log.warn(
        `No measurements provided for "${dataSourceId}" measures ingest`,
      );
      return;
    }

    let measures, asset;

    if (isTargetApi(target) && isSourceApi(source)) {
      const { asset: assetResult, measures: measuresResult } =
        await this.ingestApiMeasures(
          indexId,
          assetId,
          source,
          target,
          measurements,
          payloadUuids,
        );
      asset = assetResult;
      measures = measuresResult;
    } else if (isTargetDevice(target) && isSourceDevice(source)) {
      const { asset: assetResult, measures: measuresResult } =
        await this.ingestDeviceMeasures(
          assetId,
          indexId,
          source,
          measurements,
          payloadUuids,
        );

      asset = assetResult;
      measures = measuresResult;
    } else {
      throw new BadRequestError(
        `Unable to ingest measure with context ${JSON.stringify({ asset, measures, source, target }, null, 2)}`,
      );
    }
    /**
     * Event before starting to process new measures.
     *
     * Useful to enrich measures before they are saved.
     */
    await this.app.trigger<EventMeasureProcessBefore>(
      "device-manager:measures:process:before",
      { asset, measures, source, target },
    );

    if (indexId) {
      await this.app.trigger<TenantEventMeasureProcessBefore>(
        `engine:${indexId}:device-manager:measures:process:before`,
        { asset, measures, source, target },
      );
    }

    const promises: Promise<any>[] = [];

    if (indexId) {
      promises.push(
        this.sdk.document
          .mCreate<MeasureContent>(
            indexId,
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
    }

    await Promise.all(promises);

    /**
     * Event at the end of the measure process pipeline.
     *
     * Useful to trigger business rules like alerts
     *
     */
    await this.app.trigger<EventMeasureProcessAfter>(
      "device-manager:measures:process:after",
      { asset, measures, source, target },
    );

    if (indexId) {
      await this.app.trigger<TenantEventMeasureProcessAfter>(
        `engine:${indexId}:device-manager:measures:process:after`,
        { asset, measures, source, target },
      );
    }
  }

  private async buildDeviceMeasures(
    source: DeviceMeasureSource,
    asset: KDocument<AssetContent> | null,
    measures: DecodedMeasurement[],
    payloadUuids: string[],
  ): Promise<MeasureContent[]> {
    const deviceMeasures: MeasureContent[] = [];

    for (const measure of measures) {
      let assetContext = null;
      if (asset !== null) {
        const assetMeasureName = this.findAssetMeasureNameFromDevice(
          source.id,
          measure.measureName,
          asset._source,
        );

        if (assetMeasureName) {
          assetContext = AssetSerializer.measureContext(
            asset,
            assetMeasureName,
          );
        }
      }

      const measureSource = deviceSourceToOriginDevice(
        source,
        measure.measureName,
        payloadUuids,
        merge(source.deviceMetadata, source.metadata),
      );

      deviceMeasures.push({
        asset: assetContext,
        measuredAt: measure.measuredAt,
        origin: measureSource,
        type: measure.type,
        values: measure.values,
      });
    }

    return deviceMeasures;
  }

  private async ingestDeviceMeasures(
    assetId: string | null,
    indexId: string,
    source: DeviceMeasureSource,
    measurements: DecodedMeasurement<JSONObject>[],
    payloadUuids: string[],
  ) {
    let assetDocument = null;
    let asset = null;
    if (assetId !== null) {
      assetDocument = await this.findAsset(indexId, assetId);
      asset = { ...assetDocument._source };
    }

    const measures = await this.buildDeviceMeasures(
      source,
      assetDocument,
      measurements,
      payloadUuids,
    );

    return { asset, measures };
  }

  private async ingestApiMeasures(
    indexId,
    assetId,
    source,
    target,
    measurements,
    payloadUuids,
  ) {
    const assetDocument = await this.findAsset(indexId, assetId);

    if (!assetDocument) {
      throw new BadRequestError(
        `Asset "${assetId}" does not exists on index "${indexId}"`,
      );
    }

    const asset = { ...assetDocument._source };

    const measures = await this.buildApiMeasures(
      source,
      assetDocument,
      measurements,
      payloadUuids,
      target.engineGroup,
    );

    return { asset, measures };
  }

  /**
   * Build the measures document received from the API
   *
   * @param source The API data source
   * @param asset The target asset to build the measure for
   * @param measure The decoded raw measures
   * @param payloadUuids The uuid's of the payloads used to create the measure
   * @param engineGroup engineGroup of model
   * @returns A MeasurementContent builded from parameters
   */
  private async buildApiMeasures(
    source: ApiMeasureSource,
    asset: KDocument<AssetContent>,
    measures: DecodedMeasurement[],
    payloadUuids: string[],
    engineGroup?: string,
  ): Promise<MeasureContent[]> {
    const apiMeasures: MeasureContent[] = [];

    for (const measure of measures) {
      let assetContext = null;
      const isInModel = await this.isMeasureNameInModel(
        measure.measureName,
        asset._source.model,
        engineGroup,
      );

      if (isInModel) {
        assetContext = AssetSerializer.measureContext(
          asset,
          measure.measureName,
        );
      }

      const measureSource = apiSourceToOriginApi(source, payloadUuids);

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
   * Check if the asset measure name is associated to the asset model
   *
   * @param measureName The measure name to check
   * @param model The asset model the measureName should belong
   *
   * @returns True if the asset measure name belongs to the asset model, false otherwise
   * @throws If the model does not exists
   */
  private async isMeasureNameInModel(
    measureName: string,
    model: string,
    engineGroup = "commons",
  ): Promise<boolean> {
    const assetModel = await ask<AskModelAssetGet>(
      "ask:device-manager:model:asset:get",
      {
        engineGroup,
        model: model,
      },
    );

    if (!assetModel) {
      throw new BadRequestError(`Model "${model}" does not exists`);
    }

    const assetMeasureName = assetModel.asset.measures.find(
      (m) => m.name === measureName,
    );

    return assetMeasureName?.name ? true : false;
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
