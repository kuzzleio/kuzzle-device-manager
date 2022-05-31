import {
  Backend,
  JSONObject,
  PluginContext,
  PluginImplementationError,
  BatchController
} from 'kuzzle';
import { InternalCollection } from '../InternalCollection';
import { DeviceManagerPlugin } from '../DeviceManagerPlugin';
import { BaseAsset } from '../models';
import {
  BaseAssetMeasure,
  DeviceManagerConfiguration,
  Measure,
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
   * @todo add before/afterUpdate events (in updates)
   */
  public async registerByDevice (
    deviceId: string,
    newMeasures: Measure[],
    { refresh }
  ) {
    const refreshableCollections = [];
    refreshableCollections.push([this.config.adminIndex, InternalCollection.DEVICES]);

    let updatedAsset: BaseAsset = null;

    const device = await this.deviceService.getDevice(this.config, deviceId);

    const engineId = device._source.engineId;
    const assetId = device._source.assetId;

    // Update asset first to update the origin of the measures
    if (assetId) {
      for (const measure of newMeasures) {
        measure.origin.assetId = device._source.assetId;
      }

      const asset = await this.assetService.getAsset(engineId, assetId);

      updatedAsset = await this.assetService.updateMeasures(
        engineId,
        asset,
        newMeasures,
        device._source.measuresName);

      refreshableCollections.push([engineId, InternalCollection.ASSETS]);
    }

    if (engineId) {
      await this.historizeEngineMeasures(engineId, newMeasures);

      refreshableCollections.push([engineId, InternalCollection.DEVICES]);
    }

    const updatedDevice = await this.deviceService.updateMeasures(device, newMeasures);

    if (refresh === 'wait_for') {
      await Promise.all(refreshableCollections.map(([index, collection]) => (
        this.sdk.collection.refresh(index, collection)
      )));
    }

    return {
      asset: updatedAsset ? updatedAsset.serialize() : null,
      device: updatedDevice.serialize(),
      engineId,
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
    const validMeasures: Measure[] = [];

    for (const measure of measures) {
      if (validateBaseMeasure(measure) && this.measuresRegister.has(measure.type)) {
        const baseMeasure = measure as BaseAssetMeasure;

        validMeasures.push({
          measuredAt: baseMeasure.measuredAt ? baseMeasure.measuredAt : Date.now(),
          origin: {
            assetId: assetId,
            id: null,
            model: null,
            payloadUuids: null,
            type: 'asset',
          },
          type: baseMeasure.type,
          unit: this.measuresRegister.get(baseMeasure.type).unit,
          values: baseMeasure.values
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
    newMeasures: Measure[]
  ) {

    await Promise.all(newMeasures.map(measure => {
      return this.batch.create<Measure>(engineId, InternalCollection.MEASURES, measure);
    }));
  }
}

function validateBaseMeasure (toValidate: JSONObject): boolean {
  return _.has(toValidate, 'values')
    && _.has(toValidate, 'type');
}
