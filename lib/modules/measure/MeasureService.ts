import {
  Backend,
  BadRequestError,
  JSONObject,
  KDocument,
  NotFoundError,
  PluginContext,
} from "kuzzle";
import _ from "lodash";

import {
  DeviceManagerConfiguration,
  DeviceManagerPlugin,
  InternalCollection,
} from "../../core";
import { DeviceContent } from "./../device";
import { Asset, AssetContent } from "../asset";
import { Device } from "../device";
import { DigitalTwinContent, Metadata } from "../shared";
import { AssetSerializer } from "../asset";
import { lock } from "../shared/utils/lock";

import {
  EventMeasureIngest,
  EventMeasureProcessAfter,
  EventMeasureProcessBefore,
  TenantEventMeasureProcessAfter,
  TenantEventMeasureProcessBefore,
} from "./types/MeasureEvents";
import {
  MeasureContent,
  AssetMeasurement,
  Measurement,
} from "./types/MeasureContent";

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

    this.app.pipe.register<EventMeasureIngest>(
      "device-manager:measures:ingest",
      async (payload) => {
        await this.ingest(
          payload.device,
          payload.measurements,
          payload.metadata,
          payload.payloadUuids
        );

        return payload;
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
   * A mutex ensure only one device can be processed at the same time
   */
  public async ingest(
    device: Device,
    measurements: Measurement<JSONObject>[],
    metadata: Metadata,
    payloadUuids: string[]
  ) {
    await lock(`measure:ingest:${device._id}`, async () => {
      const asset = await this.tryGetLinkedAsset(
        device._source.engineId,
        device._source.assetId
      );

      if (!measurements) {
        this.app.log.warn(
          `Cannot find measurements for device "${device._source.reference}"`
        );
        return;
      }

      const measures = this.buildMeasures(
        device,
        asset,
        measurements,
        payloadUuids
      );

      device._source.metadata = _.merge(device._source.metadata, metadata);

      /**
       * Event before starting to process new measures.
       *
       * Useful to enrich measures before they are saved.
       */
      const { measures: updatedMeasures } =
        await this.app.trigger<EventMeasureProcessBefore>(
          "device-manager:measures:process:before",
          { asset, device, measures }
        );

      if (device._source.engineId) {
        await this.app.trigger<TenantEventMeasureProcessBefore>(
          `engine:${device._source.engineId}:device-manager:measures:process:before`,
          { asset, device, measures }
        );
      }

      this.mergeMeasures(device, updatedMeasures);

      const promises = [];

      promises.push(
        this.sdk.document.update<DeviceContent>(
          this.config.adminIndex,
          InternalCollection.DEVICES,
          device._id,
          device._source
        )
      );

      if (device._source.engineId) {
        promises.push(
          this.sdk.document.update<DeviceContent>(
            device._source.engineId,
            InternalCollection.DEVICES,
            device._id,
            device._source
          )
        );

        promises.push(
          this.sdk.document.mCreate<MeasureContent>(
            device._source.engineId,
            InternalCollection.MEASURES,
            updatedMeasures.map((measure) => ({ body: measure })),
          ).then(({ errors }) => {
            if (errors.length !== 0) {
              throw errors[0];
            }
          })
        );

        if (asset) {
          this.mergeMeasures(asset, updatedMeasures);

          // @todo potential race condition if 2 differents device are linked
          // to the same asset and get processed at the same time
          // asset measures update could be protected by mutex
          promises.push(
            this.sdk.document.update<AssetContent>(
              device._source.engineId,
              InternalCollection.ASSETS,
              asset._id,
              asset._source
            )
          );
        }
      }

      await Promise.all(promises);

      /**
       * Event at the end of the measure process pipeline.
       *
       * Useful to trigger alerts.
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

      if (device._source.engineId) {
        await this.app.trigger<TenantEventMeasureProcessAfter>(
          `engine:${device._source.engineId}:device-manager:measures:process:after`,
          { asset, device, measures }
        );
      }
    });
  }

  private mergeMeasures(
    digitalTwin: KDocument<DigitalTwinContent>,
    measures: MeasureContent[]
  ) {
    for (const newMeasure of measures) {
      const idx = digitalTwin._source.measures.findIndex((measure) => {
        const [measureName, newMeasureName] = measure.assetMeasureName
          ? [measure.assetMeasureName, newMeasure.assetMeasureName]
          : [measure.deviceMeasureName, newMeasure.deviceMeasureName];

        return measureName === newMeasureName;
      });

      if (idx === -1) {
        digitalTwin._source.measures.push(newMeasure);
      } else if (
        newMeasure.measuredAt > digitalTwin._source.measures[idx].measuredAt
      ) {
        digitalTwin._source.measures[idx] = newMeasure;
      }
    }
  }

  private buildMeasures(
    device: Device,
    asset: Asset,
    measurements: Measurement[],
    payloadUuids: string[]
  ): MeasureContent[] {
    const measures: MeasureContent[] = [];

    for (const measurement of measurements) {
      // @todo check if measure type exists

      const deviceMeasureName =
        measurement.deviceMeasureName || measurement.type;

      const assetMeasureName = this.tryFindAssetMeasureName(
        device,
        asset,
        deviceMeasureName
      );

      const measureContent: MeasureContent = {
        asset: AssetSerializer.description(asset),
        assetMeasureName,
        deviceMeasureName,
        measuredAt: measurement.measuredAt,
        origin: {
          deviceModel: device._source.model,
          id: device._id,
          payloadUuids,
          type: "device",
        },
        type: measurement.type,
        values: measurement.values,
      };

      measures.push(measureContent);
    }

    return measures;
  }

  /**
   * Register new measures from a device, updates :
   * - linked asset
   * - engine measures
   *
   * The `measuredAt` of the measures will be set automatically if not setted
   *
   * @param engineId Engine id
   * @param assetId Asset id
   * @param jsonMeasurements `AssetMeasurement` array from a request
   * @param kuid Kuid of the user pushing the measurements
   * @param options.refresh Wait for ES indexation
   * @param options.strict If true, throw if an operation isn't possible
   */
  public async registerByAsset(
    engineId: string,
    assetId: string,
    measurement: AssetMeasurement,
    kuid: string,
    { refresh }: { refresh?: any } = {}
  ) {
    return lock(`asset:${engineId}:${assetId}`, async () => {
      const asset = await this.tryGetLinkedAsset(engineId, assetId);

      if (!asset) {
        throw new NotFoundError(`Asset "${assetId}" does not exist`);
      }

      if (!measurement.type) {
        throw new BadRequestError(
          `Invalid measurement for asset "${asset._id}": missing "type"`
        );
      }

      if (
        !measurement.values ||
        Object.keys(measurement.values || {}).length === 0
      ) {
        throw new BadRequestError(
          `Invalid measurement for asset "${asset._id}": missing "values"`
        );
      }

      // @todo check if measure type exists

      const measure: MeasureContent<JSONObject> = {
        asset: AssetSerializer.description(asset),
        assetMeasureName: measurement.assetMeasureName ?? measurement.type,
        deviceMeasureName: null,
        measuredAt: measurement.measuredAt || Date.now(),
        origin: {
          id: kuid,
          type: "user",
        },
        type: measurement.type,
        values: measurement.values,
      };

      this.mergeMeasures(asset, [measure]);

      const [updatedAsset] = await Promise.all([
        this.sdk.document.update<AssetContent>(
          engineId,
          InternalCollection.ASSETS,
          asset._id,
          { measures: asset._source.measures },
          { refresh }
        ),
        this.sdk.document.create<MeasureContent>(
          engineId,
          InternalCollection.MEASURES,
          measure,
          null,
          { refresh }
        ),
      ]);

      return {
        asset: new Asset(updatedAsset._source, updatedAsset._id),
      };
    });
  }

  private async tryGetLinkedAsset(
    engineId: string,
    assetId: string
  ): Promise<Asset> {
    if (!assetId) {
      return null;
    }

    try {
      const { _source, _id } = await this.sdk.document.get<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        assetId
      );

      return new Asset(_source, _id);
    } catch (error) {
      this.app.log.error(`[${engineId}] Cannot find asset "${assetId}".`);

      return null;
    }
  }

  private tryFindAssetMeasureName(
    device: Device,
    asset: Asset,
    deviceMeasureName: string
  ): string {
    if (!asset) {
      return undefined;
    }

    const deviceLink = asset._source.deviceLinks.find(
      (link) => link.deviceId === device._id
    );

    if (!deviceLink) {
      this.app.log.error(
        `The device "${device._id}" is not linked to the asset "${asset._id}"`
      );
      return undefined;
    }

    const measureLink = deviceLink.measureNamesLinks.find(
      (nameLink) => nameLink.deviceMeasureName === deviceMeasureName
    );

    return measureLink ? measureLink.assetMeasureName : undefined;
  }
}
