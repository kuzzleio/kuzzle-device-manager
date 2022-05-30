import { Backend, BatchController, JSONObject, PluginContext, PluginImplementationError } from 'kuzzle';
import { DeviceManagerPlugin } from '../DeviceManagerPlugin';
import { BaseAsset } from '../models';
import { DeviceManagerConfiguration, MeasureContent } from '../types';
import { validateMeasurement } from '../utils';
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
  private static _collectionName: string = 'measures';

  private get sdk () {
    return this.context.accessors.sdk;
  }

  public static get collectionName (): string {
    return MeasureService._collectionName;
  }

  private get app (): Backend {
    return global.app;
  }

  constructor (
    plugin: DeviceManagerPlugin,
    deviceService: DeviceService,
    assetService: AssetService,
    measuresRegister: MeasuresRegister
  ) {
    this.config = plugin.config as any;
    this.context = plugin.context;

    this.deviceService = deviceService;
    this.assetService = assetService;
    this.measuresRegister = measuresRegister;

    this.batch = new BatchController(this.sdk as any, {
      interval: plugin.config.batchInterval
    });
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
    newMeasures: MeasureContent[],
    { refresh }
  ) {
    const refreshableCollections = [];
    refreshableCollections.push([this.config.adminIndex, DeviceService.collectionName]);

    let updatedAsset: BaseAsset = null;

    const device = await DeviceService.getDevice(this.sdk, this.config, deviceId);

    const engineId = device._source.engineId;
    const assetId = device._source.assetId;

    // Update asset first to update the origin of the measures
    if (assetId) {
      for (const measure of newMeasures) {
        measure.origin.assetId = device._source.assetId;
      }

      updatedAsset = await this.assetService.updateMeasures(
        engineId,
        assetId,
        newMeasures,
        device._source.measuresName);

      refreshableCollections.push([engineId, AssetService.collectionName]);
    }

    if (engineId) {
      await this.historizeEngineMeasures(engineId, newMeasures);

      refreshableCollections.push([engineId, DeviceService.collectionName]);
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
      [this.config.adminIndex, AssetService.collectionName],
      [engineId, MeasureService.collectionName]
    ];

    const newMeasures = { invalids: [], valids: [] };

    for (const measure of measures) {
      if (validateMeasurement(measure) && this.measuresRegister.has(measure.type)) {
        newMeasures.valids.push({
          measuredAt: measure.measuredAt ? measure.measureAt : Date.now(),
          origin: {
            assetId: assetId,
            id: null,
            model: null,
            payloadUuids: null,
            type: 'asset',
          },
          type: measure.type,
          unit: this.measuresRegister.get(measure.type).unit,
          values: measure.values
        });
      }
      else {
        newMeasures.invalids.push(measure);
      }
    }

    if (strict && newMeasures.invalids.length) {
      throw new PluginImplementationError(`Some measure pushed by asset ${assetId} are invalid, all has been blocked`);
    }

    if (! newMeasures.valids.length) {
      // TODO Return normal response payload (device, asset, engineId...)
      return {};
    }

    const updatedAsset = await this.assetService.updateMeasures(
      engineId,
      assetId,
      newMeasures.valids);

    await this.historizeEngineMeasures(engineId, newMeasures.valids);

    if (refresh === 'wait_for') {
      await Promise.all(refreshableCollections.map(([index, collection]) => (
        this.sdk.collection.refresh(index, collection)
      )));
    }

    return {
      asset: updatedAsset ? updatedAsset.serialize() : null,
      engineId,
      errors: newMeasures.invalids
    };
  }

  private async historizeEngineMeasures (
    engineId: string,
    newMeasures: MeasureContent[]
  ) {

    await Promise.all(newMeasures.map(measure => {
      return this.batch.create<MeasureContent>(engineId, MeasureService.collectionName, measure);
    }));
  }
}
