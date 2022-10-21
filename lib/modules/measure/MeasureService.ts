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

import {
  MeasureContent,
  AssetMeasurement,
  Measurement,
} from "./types/MeasureContent";
import { Asset, AssetContent } from "../asset";
import { Device, DeviceSerializer } from "../device";
import { DigitalTwinContent } from "../shared";
import { AssetSerializer } from "../asset";
import { DecodedPayload } from "../decoder";

import {
  EventMeasureIngest,
  EventMeasureProcessAfter,
  EventMeasureProcessBefore,
  TenantEventMeasureProcessAfter,
  TenantEventMeasureProcessBefore,
} from "./types/MeasureEvents";
import { MeasuresRegister } from "../../core/registers/MeasuresRegister";

export class MeasureService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private measuresRegister: MeasuresRegister;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  private get app(): Backend {
    return global.app;
  }

  constructor(plugin: DeviceManagerPlugin, measuresRegister: MeasuresRegister) {
    this.config = plugin.config as any;
    this.context = plugin.context;

    this.measuresRegister = measuresRegister;

    this.app.pipe.register<EventMeasureIngest>(
      "device-manager:measures:ingest",
      async (payload) => {
        await this.ingest(
          payload.deviceModel,
          payload.decodedPayload,
          payload.payloadUuids,
          { refresh: payload.refresh }
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
   * @param deviceModel Model of the device
   * @param decodedPayloads `decodedPayload`
   * @param payloadUuids Payload Uuids that generated the measurements
   * @param options.provisionDevice If true and a `decodedPayload` reference a nonexisting device, create this device
   * @param options.refresh Wait for ES indexation
   */
  public async ingest(
    deviceModel: string,
    decodedPayload: DecodedPayload,
    payloadUuids: string[],
    options: {
      refresh?: string;
    }
  ) {
    const devices = await this.getDevices(
      deviceModel,
      decodedPayload.references,
      options
    );

    for (const device of devices) {
      const asset = await this.tryGetLinkedAsset(
        device._source.engineId,
        device._source.assetId
      );

      const measurements = decodedPayload.getMeasurements(
        device._source.reference
      );

      if (!measurements) {
        this.app.log.warn(
          `Cannot find measurements for device "${device._source.reference}"`
        );
        continue;
      }

      const measures = this.buildMeasures(
        device,
        asset,
        measurements,
        payloadUuids
      );

      device._source.metadata = _.merge(
        device._source.metadata,
        decodedPayload.getMetadata(device._source.reference)
      );

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

      await this.sdk.document.update<DeviceContent>(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        device._id,
        device._source
      );

      if (device._source.engineId) {
        await this.sdk.document.update<DeviceContent>(
          device._source.engineId,
          InternalCollection.DEVICES,
          device._id,
          device._source
        );

        await this.sdk.document.mCreate<MeasureContent>(
          device._source.engineId,
          InternalCollection.MEASURES,
          updatedMeasures.map((measure) => ({ body: measure })),
          { strict: true }
        );

        if (asset) {
          this.mergeMeasures(asset, updatedMeasures);

          await this.sdk.document.update<AssetContent>(
            device._source.engineId,
            InternalCollection.ASSETS,
            asset._id,
            asset._source
          );
        }
      }

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
    }
  }

  private mergeMeasures(
    digitalTwin: KDocument<DigitalTwinContent>,
    measures: MeasureContent[]
  ) {
    for (const newMeasure of measures) {
      const idx = digitalTwin._source.measures.findIndex(
        (measure) => measure.deviceMeasureName === newMeasure.deviceMeasureName
      );

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
      if (!this.measuresRegister.has(measurement.type)) {
        this.app.log.warn(
          `Unknown measurement "${measurement.type}" from Decoder "${device._source.model}"`
        );
        continue;
      }

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
        unit: this.measuresRegister.get(measurement.type).unit,
        values: measurement.values,
      };

      measures.push(measureContent);
    }

    return measures;
  }

  /**
   * Get devices or create missing ones (when auto-provisionning is enabled)
   */
  private async getDevices(
    deviceModel: string,
    references: string[],
    {
      refresh,
    }: {
      refresh?: any;
    } = {}
  ) {
    const devices: Device[] = [];

    const { successes, errors } = await this.sdk.document.mGet<DeviceContent>(
      this.config.adminIndex,
      InternalCollection.DEVICES,
      references.map((reference) => DeviceSerializer.id(deviceModel, reference))
    );

    for (const { _source, _id } of successes) {
      devices.push(new Device(_source, _id));
    }

    // If we have unknown devices, let's check if we should register them
    if (errors.length > 0) {
      const { _source } = await this.sdk.document.get(
        this.config.adminIndex,
        this.config.adminCollections.config.name,
        "plugin--device-manager"
      );

      if (_source["device-manager"].provisioningStrategy === "auto") {
        const newDevices = await this.provisionDevices(deviceModel, errors, {
          refresh,
        });
        devices.push(...newDevices);
      } else {
        this.app.log.info(
          `Skipping new devices "${errors.join(
            ", "
          )}". Auto-provisioning is disabled.`
        );
      }
    }

    return devices;
  }

  private async provisionDevices(
    deviceModel: string,
    deviceIds: string[],
    { refresh }: { refresh: any }
  ): Promise<Device[]> {
    const newDevices = deviceIds.map((deviceId) => {
      // Reference may contains a "-"
      const [, ...rest] = deviceId.split("-");
      const reference = rest.join("-");

      return {
        _id: DeviceSerializer.id(deviceModel, reference),
        body: {
          measures: [],
          model: deviceModel,
          reference,
        },
      };
    });

    const { successes, errors } =
      await this.sdk.document.mCreate<DeviceContent>(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        newDevices,
        { refresh }
      );

    for (const error of errors) {
      this.app.log.error(
        `Cannot create device "${error.document._id}": ${error.reason}`
      );
    }

    return successes.map(({ _source, _id }) => new Device(_source as any, _id));
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
    const asset = await this.tryGetLinkedAsset(engineId, assetId);

    if (!asset) {
      throw new NotFoundError(`Asset "${assetId}" does not exist`);
    }

    if (
      !measurement.type ||
      !measurement.values ||
      this.measuresRegister.has(measurement.type)
    ) {
      throw new BadRequestError(
        `Invalid measurement for asset "${asset._id}": missing "type", "values" or unknown measure type`
      );
    }

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
      unit: this.measuresRegister.get(measurement.type).unit,
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
