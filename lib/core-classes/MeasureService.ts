import {
  Backend,
  BatchController
  JSONObject,
  PluginContext,
  PluginImplementationError,
} from 'kuzzle';
import _ from 'lodash';

import { InternalCollection } from '../InternalCollection';
import { DeviceManagerPlugin } from '../DeviceManagerPlugin';
import { BaseAsset, Device } from '../models';
import {
  DecodedPayload,
  DeviceManagerConfiguration,
  MeasureContent,
  Measurement,
  OriginType,
} from '../types';
import { AssetService } from './AssetService';
import { DeviceService } from './DeviceService';
import { MeasuresRegister } from './registers/MeasuresRegister';

export class MeasureService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private batch: BatchController;
  private deviceService: DeviceService;
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
    deviceService: DeviceService,
    assetService: AssetService,
    measuresRegister: MeasuresRegister
  ) {
    this.config = plugin.config as any;
    this.context = plugin.context;

    this.deviceService = deviceService;
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
   * Do not call other `registerX`, only `updateX`
   *
   * TODO : on device to asset link check if measure naming link already exist ?
   * @todo add before/afterUpdate events (in updates)
   */
  public async registerByDevice (
    deviceModel: string,
    decodedPayloads: DecodedPayload[],
    payloadUuid: string,
    { refresh }
  ) {
    // TODO : Stock updated assets, devices and measures for return result ?
    const enginesToRefresh: Map<string, { assets: boolean, devices: boolean }>
      = new Map();

    const measureContentsByEngineId: Map<string, MeasureContent[]> = new Map();

    const measureContentsByDeviceId: Map<string, {
      device: Device,
      measureContents: MeasureContent []
    }> = new Map();

    const measureContentsByAssetId: Map<string, {
      engineId: string, asset: BaseAsset, measureContents: MeasureContent []
    }> = new Map();

    // Refine Measures
    for (const { deviceReference, measurements } of decodedPayloads) {
      const deviceId = Device.id(deviceModel, deviceReference);
      const device = await this.deviceService.getDevice(this.config, deviceId);

      const engineId = device._source.engineId;

      let asset: BaseAsset = null;
      const assetId = device._source.assetId;

      if (assetId) {
        asset = await this.assetService.getAsset(engineId, assetId);
      }

      for (const measurement of measurements) {
        const assetMeasureName = asset
          ? asset._source.deviceLinks.find(
            deviceLink => deviceLink.deviceId === deviceId
          ).measuresNameLinks.find(
            measureNameLink =>
            measureNameLink.deviceMeasureName === measurement.deviceMeasureName
          ).assetMeasureName
          : null;

        if (asset) {
          assetMeasureName = asset._source.deviceLinks.find(
            deviceLink => deviceLink.deviceId === deviceId
          ).measuresNameLinks.find(
            measureNameLink =>
            measureNameLink.deviceMeasureName === measurement.deviceMeasureName
          ).assetMeasureName;
        }

        const measureContent = {
          type: measurement.type,
          values: measurement.values,
          measuredAt: measurement.measuredAt,
          deviceMeasureName: measurement.deviceMeasureName,
          unit: this.measuresRegister.get(measurement.type).unit,
          originType: OriginType.DEVICE,
          payloadUuids: [payloadUuid],
          deviceModel,
          deviceId,
          assetId,
          assetMeasureName,
        };

        const forEngine = measureContentsByEngineId.get(engineId);
        if (forEngine) {
          forEngine.push(measureContent);
        }
        else {
          measureContentsByEngineId.set(engineId, [measureContent]);
        }

        const forDevice = measureContentsByDeviceId.get(deviceId);
        if (forDevice) {
          forDevice.measureContents.push(measureContent);
        }
        else {
          measureContentsByDeviceId.set(deviceId, {
            device,
            measureContents: [measureContent],
          });
        }

        const forAsset = measureContentsByAssetId.get(assetId);
        if (forAsset) {
          forAsset.measureContents.push(measureContent);
        }
        else {
          measureContentsByAssetId.set(assetId, {
            engineId,
            asset,
            measureContents: [measureContent],
          });
        }
      }
    }

    // Send measures

    for (const [engineId, measureContents] of measureContentsByEngineId) {
      await this.historizeEngineMeasures(engineId, measureContents);

      enginesToRefresh.set(engineId, {
        devices = false,
        assets = false
      });
    }

    for (const [_, { device, measureContents }] of measureContentsByDeviceId.entries()) {
      await this.deviceService.updateMeasures(
        device,
        measureContents);

      if (device._source.engineId) {
        enginesToRefresh.set(device._source.engineId, {
          devices: true,
          assets: device._source.assetId ? true : false
        });
      }
    }

    for (const [_, { asset, engineId, measureContents }] of measureContentsByAssetId.entries()) {
      await this.assetService.updateMeasures(
        engineId,
        asset,
        measureContents);
    }

    if (refresh === 'wait_for') {
      // Refine toRefresh
      const collectionsToRefresh: { index: string, collection: InternalCollection }[]
        = [{
          index: this.config.adminIndex,
          collection: InternalCollection.DEVICES,
        }];

      for (const [engineId, toRefresh] of enginesToRefresh.entries()) {
        collectionsToRefresh.push({
          index: engineId,
          collection: InternalCollection.MEASURES
        });

        if (toRefresh.assets) {
          collectionsToRefresh.push({
            index: engineId,
            collection: InternalCollection.ASSETS
          });
        }

        if (toRefresh.devices) {
          collectionsToRefresh.push({
            index: engineId,
            collection: InternalCollection.DEVICES,
          });
        }
      }

      await Promise.all(
        collectionsToRefresh.map(({ index, collection }) =>
          this.sdk.collection.refresh(index, collection)));
    }

    return {
      // asset: updatedAsset ? updatedAsset.serialize() : null,
      // device: updatedDevice.serialize(),
      // engineId,
    };
  }

  /**
   * Register new measures from a device, updates :
   * - linked asset
   * - engine measures
   *
   * The `measuredAt` will be set automatically if not setted
   * Do not call other `registerX`, only `updateX`
   *
   * @todo add before/afterUpdate events (in updates)
   */
  public async registerByAsset (
    engineId: string,
    assetId: string,
    measures: JSONObject[],
    refresh: string,
    strict: boolean
  ) {
    const refreshableCollections = [
      [this.config.adminIndex, InternalCollection.ASSETS],
      [engineId, InternalCollection.MEASURES]
    ];

    const invalidMeasures: JSONObject[] = [];
    const validMeasures: MeasureContent[] = [];

    for (const measure of measures) {
      if (validateAssetMeasurement(measure) && this.measuresRegister.has(measure.type)) {
        const measurement = measure as AssetMeasurement;

        validMeasures.push({
          measuredAt: measurement.measuredAt ? measurement.measuredAt : Date.now(),
          origin: {
            assetId,
            id: null,
            model: null,
            payloadUuids: null,
            type: 'asset',
          },
          type: measurement.type,
          unit: this.measuresRegister.get(measurement.type).unit,
          values: measurement.values
        });
      }
      else {
        invalidMeasures.push(measure);
      }
    }

    if (strict && invalidMeasures.length) {
      throw new PluginImplementationError(`Some measure pushed by asset ${assetId} are invalid, all has been blocked`);
    }

    const asset = await this.assetService.getAsset(engineId, assetId);

    if (! validMeasures.length) {
      return {
        asset: asset.serialize(),
        engineId,
        errors: invalidMeasures
      };
    }

    const updatedAsset = await this.assetService.updateMeasures(
      engineId,
      asset,
      validMeasures);

    await this.historizeEngineMeasures(engineId, validMeasures);

    if (refresh === 'wait_for') {
      await Promise.all(refreshableCollections.map(([index, collection]) => (
        this.sdk.collection.refresh(index, collection)
      )));
    }

    return {
      asset: updatedAsset ? updatedAsset.serialize() : null,
      engineId,
      errors: invalidMeasures
    };
  }

  private async historizeEngineMeasures (
    engineId: string,
    newMeasures: MeasureContent[]
  ) {

    await Promise.all(newMeasures.map(measure => {
      return this.batch.create<MeasureContent>(engineId, InternalCollection.MEASURES, measure);
    }));
  }
}

function validateAssetMeasurement (toValidate: JSONObject): boolean {
  return _.has(toValidate, 'values')
    && _.has(toValidate, 'type');
}
