import {
  Backend,
  BatchController,
  JSONObject,
  NotFoundError,
  PluginContext,
  PluginImplementationError,
} from 'kuzzle';
import _ from 'lodash';

import { InternalCollection } from '../InternalCollection';
import { DeviceManagerPlugin } from '../DeviceManagerPlugin';
import { BaseAsset, Device } from '../models';
import {
  AssetMeasurement,
  DecodedPayload,
  DeviceManagerConfiguration,
  MeasureContent,
  Measurement,
  BaseAssetContent,
  DeviceContent,
} from '../types';
import { AssetService } from './AssetService';
import { MeasuresRegister } from './registers/MeasuresRegister';

export class MeasureService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private batch: BatchController;
  private assetService: AssetService;
  private measuresRegister: MeasuresRegister;

  private get sdk () {
    return this.context.accessors.sdk;
  }

  private get app (): Backend {
    return global.app;
  }

  constructor (
    plugin: DeviceManagerPlugin,
    batchController: BatchController,
    assetService: AssetService,
    measuresRegister: MeasuresRegister
  ) {
    this.config = plugin.config as any;
    this.context = plugin.context;

    this.assetService = assetService;
    this.measuresRegister = measuresRegister;

    this.batch = batchController;
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
  public async processDecodedPayload (
    deviceModel: string,
    decodedPayload: DecodedPayload,
    payloadUuids: string[],
    options:
    {
      refresh?: string,
    }
  ) {
    const devices = await this.getDevices(deviceModel, decodedPayload.references, options);

    for (const device of devices) {
      let asset: BaseAsset = null;

      if (device._source.assetId) {
        try {
          const { _source, _id } = await this.batch.get<BaseAssetContent>(
            device._source.engineId,
            InternalCollection.ASSETS,
            device._source.assetId);

          asset = new BaseAsset(_source, _id);
        }
        catch (error) {
          this.app.log.error(`[${device._source.engineId}] Cannot find asset "${device._source.assetId}" linked to device "${device._id}".`);
        }
      }

      const measures = this.buildMeasures(
        device,
        asset,
        decodedPayload.getMeasurements(device._source.reference),
        payloadUuids,
      );

      /**
       * Event before starting to process new measures.
       *
       * Useful to enrich measures before they are saved.
       */
      const { measures: updatedMeasures } = await this.app.trigger(
        'device-manager:measures:process:before',
        { asset, device, measures });

      if (device._source.engineId) {
        await this.app.trigger(
          `engine:${device._source.engineId}:device-manager:measures:process:before`,
          { asset, device, measures });
      }

      device.updateMeasures(updatedMeasures);

      await this.sdk.document.update<DeviceContent>(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        device._id,
        { measures: device._source.measures });

      if (device._source.engineId) {
        await this.sdk.document.update<DeviceContent>(
          device._source.engineId,
          InternalCollection.DEVICES,
          device._id,
          { measures: device._source.measures });

        // @todo replace by batch.mCreate when available
        await this.sdk.document.mCreate<MeasureContent>(
          device._source.engineId,
          InternalCollection.MEASURES,
          updatedMeasures.map(measure => ({ body: measure })),
          { strict: true });

        if (asset) {
          asset.updateMeasures(updatedMeasures);

          await this.sdk.document.update<BaseAssetContent>(
            device._source.engineId,
            InternalCollection.ASSETS,
            asset._id,
            { measures: asset._source.measures });
        }
      }

      /**
       * Event at the end of the measure process pipeline.
       *
       * Useful to trigger alerts.
       *
       * @todo test this
       */
      await this.app.trigger(
        'device-manager:measures:process:after',
        { asset, device, measures });

      if (device._source.engineId) {
        await this.app.trigger(
          `engine:${device._source.engineId}:device-manager:measures:process:after`,
          { asset, device, measures });
      }
    }
  }

  private buildMeasures (
    device: Device,
    asset: BaseAsset,
    measurements: Measurement[],
    payloadUuids: string[],
  ): MeasureContent[] {
    const measures: MeasureContent[] = [];

    for (const measurement of measurements) {
      if (! this.measuresRegister.has(measurement.type)) {
        this.app.log.warn(`Unknown measurement "${measurement.type}" from Decoder "${device._source.model}"`);
        continue;
      }

      const deviceMeasureName = measurement.deviceMeasureName || measurement.type;

      const assetMeasureName = asset === null ? undefined : this.findAssetMeasureName(
        device,
        asset,
        deviceMeasureName);

      const measureContent: MeasureContent = {
        assetMeasureName,
        deviceMeasureName,
        measuredAt: measurement.measuredAt,
        origin: {
          assetId: asset?._id,
          deviceModel: device._source.model,
          id: device._id,
          payloadUuids,
          type: 'device',
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
  private async getDevices (
    deviceModel: string,
    references: string[],
    { refresh }:
    {
      refresh?: any,
    }
  ) {
    const devices: Device[] = [];

    // @todo replace with batch.mGet when available
    const { successes, errors } = await this.sdk.document.mGet<DeviceContent>(
      this.config.adminIndex,
      InternalCollection.DEVICES,
      references.map(reference => Device.id(deviceModel, reference)));

    for (const { _source, _id } of successes) {
      devices.push(new Device(_source, _id));
    }

    // If we have unknown devices, let's check if we should register them
    if (errors.length > 0) {
      const { _source } = await this.batch.get(
        this.config.adminIndex,
        this.config.adminCollections.config.name,
        'plugin--device-manager');

      if (_source['device-manager'].provisioningStrategy === 'auto') {
        const newDevices = await this.provisionDevices(deviceModel, errors, { refresh });
        devices.push(...newDevices);
      }
      else {
        this.app.log.info(`Skipping new devices "${errors.join(', ')}". Auto-provisioning is disabled.`);
      }
    }

    return devices;
  }

  private async provisionDevices (deviceModel: string, deviceIds: string[], { refresh }: { refresh: any }): Promise<Device[]> {
    const newDevices = deviceIds.map(deviceId => {
      // Reference may contains a "-"
      const [, ...rest ] = deviceId.split('-');
      const reference = rest.join('-');

      return {
        _id: Device.id(deviceModel, reference),
        body: {
          measures: [],
          model: deviceModel,
          reference,
        }
      };
    });

    // @todo replace with batch.mCreate when available
    const { successes, errors } = await this.sdk.document.mCreate<DeviceContent>(
      this.config.adminIndex,
      InternalCollection.DEVICES,
      newDevices,
      { refresh });

    for (const error of errors) {
      this.app.log.error(`Cannot create device "${error.document._id}": ${error.reason}`);
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
  public async registerByAsset (
    engineId: string,
    assetId: string,
    jsonMeasurements: JSONObject[],
    kuid: string,
    { refresh, strict }: { refresh?: 'wait_for' | 'false', strict?: boolean } = {}
  ) {
    const invalidMeasurements: JSONObject[] = [];
    const validMeasures: MeasureContent[] = [];

    const asset = await this.assetService.get(engineId, assetId);

    if (! asset) {
      throw new NotFoundError(`Asset ${assetId} does not exist`);
    }

    for (const jsonMeasurement of jsonMeasurements) {
      if (this.validateAssetMeasurement(jsonMeasurement)
        && this.measuresRegister.has(jsonMeasurement.type)) {
        const measurement = jsonMeasurement as AssetMeasurement;

        const assetMeasureName = measurement.assetMeasureName ?? measurement.type;

        validMeasures.push({
          assetMeasureName,
          deviceMeasureName: null,
          measuredAt: measurement.measuredAt || Date.now(),
          origin: {
            assetId,
            id: kuid,
            type: 'user',
          },
          type: measurement.type,
          unit: this.measuresRegister.get(measurement.type).unit,
          values: measurement.values,
        });
      }
      else {
        invalidMeasurements.push(jsonMeasurement);
      }
    }

    if (strict && invalidMeasurements.length) {
      throw new PluginImplementationError(`Some measure pushed by asset ${assetId} are invalid, all has been blocked`);
    }

    if (! validMeasures.length) {
      return {
        asset: asset.serialize(),
        engineId,
        invalids: invalidMeasurements,
        valids: [],
      };
    }

    asset.updateMeasures(validMeasures);


    await this.sdk.document.update(
      engineId,
      InternalCollection.ASSETS,
      asset._id,
      { measures: asset._source.measures }
    );

    await this.historizeEngineMeasures(engineId, validMeasures, { refresh });

    return {
      asset: asset.serialize,
      engineId,
      invalids: invalidMeasurements,
      valids: validMeasures,
    };
  }

  /**
   * Register new measures in the engine
   */
  private async historizeEngineMeasures (
    engineId: string,
    newMeasures: MeasureContent[],
    { refresh }: { refresh?: 'wait_for' | 'false' } = {}
  ) {
    await Promise.all(newMeasures.map(measure => {
      return this.batch.create<MeasureContent>(
        engineId,
        InternalCollection.MEASURES,
        measure,
        null,
        { refresh });
    }));
  }

  private validateAssetMeasurement (toValidate: JSONObject): boolean {
    return _.has(toValidate, 'values')
      && _.has(toValidate, 'type')
      && this.measuresRegister.has(toValidate.type);
  }

  private findAssetMeasureName (
    device: Device,
    asset: BaseAsset,
    deviceMeasureName: string,
  ): string {
    const deviceLink = asset._source.deviceLinks.find(
      link => link.deviceId === device._id);

    const measureLink = deviceLink.measureNamesLinks.find(
      nameLink => nameLink.deviceMeasureName === deviceMeasureName);

    return measureLink.assetMeasureName;
  }
}
