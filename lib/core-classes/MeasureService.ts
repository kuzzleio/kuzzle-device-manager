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
  OriginType,
} from '../types';
import { AssetService } from './AssetService';
import { DeviceService } from './DeviceService';
import { MeasuresRegister } from './registers/MeasuresRegister';

/**
 * Record<engineId, MeasureContent[]>
 */
type EngineMeasuresCache = Record<string, MeasureContent[]>;

type AssetCacheEntity = { asset: BaseAsset, measures: MeasureContent[] };

type DeviceCacheEntity = { device: Device, measures: MeasureContent[] };

/**
 * Record<documentModel, Entity[]>
 */
type EntityMeasuresCache<Entity> = Record<string, Entity>;

/**
 * Record<engineId, EntityMeasuresCache<Entity>>
 */
type EntityMeasuresInEngineCache<Entity> = Record<string, // engineId
  EntityMeasuresCache<Entity>>;

export class MeasureService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private batch: BatchController;
  private deviceService: DeviceService;
  private assetService: AssetService;
  private measuresRegister: MeasuresRegister;
  private static eventId = 'device-manager:measure';

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
   * @param deviceModel Model of the device
   * @param decodedPayloads `decodedPayload` 
   * @param payloadUuids Payload Uuids that generated the measurements
   * @param {object} options
   * @param options.provisionDevice If true and a `decodedPayload`
   * reference a nonexisting device, create this device
   * @param options.refresh Wait for ES indexation
   */
  public async registerByDecodedPayload (
    deviceModel: string,
    decodedPayloads: DecodedPayload,
    payloadUuids: Array<string>,
    { autoProvisionDevice, refresh }:
    {
      autoProvisionDevice?: boolean,
      refresh?: 'wait_for' | 'false',
    } = {}
  ) {
    const eventId = `${MeasureService.eventId}:registerByDecodedPayload`;

    // Create caching structures
    const engineMeasures: EngineMeasuresCache = {};

    const assetMeasuresInEngine: EntityMeasuresInEngineCache<AssetCacheEntity> = {};

    const deviceMeasuresInEngine: EntityMeasuresInEngineCache<DeviceCacheEntity> = {};

    const measurementsWithoutDevice: Record<string, Measurement[]> = {};
    const unknownTypeMeasurements: Measurement[] = [];

    // Craft and insert measures in cache by each device
    // Need to be atomic (no Promise.all) because it would erase the array in `assetMeasuresInEngineCache` and `deviceMeasuresInEngineCache`
    for (const [reference, measurements] of Object.entries(decodedPayloads)) {
      await this.insertIntoSortingRecords(
        engineMeasures,
        assetMeasuresInEngine,
        deviceMeasuresInEngine,
        measurementsWithoutDevice,
        unknownTypeMeasurements,
        payloadUuids,
        deviceModel,
        reference,
        measurements,
        autoProvisionDevice,
      );
    }

    const response = await this.app.trigger(`${eventId}:before`, {
      assetMeasuresInEngineCache: assetMeasuresInEngine,
      deviceMeasuresInEngineCache: deviceMeasuresInEngine,
      engineMeasuresCache: engineMeasures,
      unknownTypeMeasurements,
    });

    // Push measures in db
    // In Engine measures
    await Promise.all(Object.entries(response.engineMeasuresCache).map(([engineId, measures]) => {
      const measureArray = measures as Array<MeasureContent>;
      return this.historizeEngineMeasures(engineId, measureArray, { refresh });
    }));

    // Update measures of assets and update documents
    await Promise.all(Object.entries(response.assetMeasuresInEngineCache).map(async ([engineId, assetMeasuresRecord]) => {
      for (const { asset, measures } of Object.values(assetMeasuresRecord)) {
        asset.updateMeasures(measures);
      }

      await this.sdk.document.mUpdate(
        engineId,
        InternalCollection.ASSETS,
        Object.values(assetMeasuresRecord).map(
          ({ asset }) => ({ _id: asset._id, body: asset._source })),
        { refresh }
      );
    }));

    // Update measures of devices and update documents
    const devices: Device[] = [];

    await Promise.all(Object.entries(response.deviceMeasuresInEngineCache).map(async ([engineId, deviceMeasuresRecord]) => {
      await Promise.all(Object.values(deviceMeasuresRecord).map(({ device, measures }) => {
        device.updateMeasures(measures);
        devices.push(device);
      }));

      if (engineId !== this.config.adminIndex) {
        await this.sdk.document.mUpdate(
          engineId,
          InternalCollection.DEVICES,
          Object.values(deviceMeasuresRecord).map(
            ({ device }) => ({ _id: device._id, body: device._source })),
          { refresh }
        );
      }
    }));

    await this.sdk.document.mUpdate(
      this.config.adminIndex,
      InternalCollection.DEVICES,
      devices.map(
        device => ({ _id: device._id, body: device._source })),
      { refresh }
    );

    await this.app.trigger(`${eventId}:after`, {
      assetMeasuresInEngineCache: assetMeasuresInEngine,
      deviceMeasuresInEngineCache: deviceMeasuresInEngine,
      engineMeasuresCache: engineMeasures,
    });

    return {
      // TOSEE : What to return, how (serialization) ?
      // TOSEE : Stock updated assets, devices and measures for return result ?
      // engineMeasuresCache,
      // assetMeasuresInEngineCache,
      // deviceMeasuresInEngineCache,
      // unaivailableTypeMeasurements,
      // measurementsWithoutDevice,
    };
  }

  /**
   * Takes all informations to craft a Measure and insert it in
   * caching structures
   */
  private async insertIntoSortingRecords (
    engineMeasuresCache: EngineMeasuresCache,
    assetMeasuresInEngineCache: EntityMeasuresInEngineCache<AssetCacheEntity>,
    deviceMeasuresInEngineCache: EntityMeasuresInEngineCache<DeviceCacheEntity>,
    measurementsWithoutDevice: Record<string, Measurement[]>,
    unknownTypeMeasurements: Measurement[],
    payloadUuids: Array<string>,
    deviceModel: string,
    reference: string,
    measurements: Measurement[],
    autoProvisionDevice: boolean,
  ) {
    // Search device in cache or get in db
    const deviceId = Device.id(deviceModel, reference);
    let device = null;
    try {
      device = await this.deviceService.getDevice(this.config, deviceId);
    }
    catch (error) {}

    if (! device) {
      if (autoProvisionDevice) {
        // TODO : Optimize, ES request to create and then update at end
        device = await this.deviceService.create({
          model: deviceModel,
          reference,
        });
      }
      else {
        measurementsWithoutDevice[reference] = measurements;
        return ;
      }
    }

    const engineId = device._source.engineId ?? this.config.adminIndex;
    const assetId = device._source.assetId;

    const deviceMeasures: { device: Device, measures: MeasureContent[] }
      = { device, measures: [] };

    let deviceMeasuresInEngine = deviceMeasuresInEngineCache[engineId];

    if (! deviceMeasuresInEngine) {
      deviceMeasuresInEngine = { [deviceId]: deviceMeasures };
      deviceMeasuresInEngineCache[engineId] = deviceMeasuresInEngine;
    }

    // Search asset in cache or get in db
    let assetCacheEntity: AssetCacheEntity = null;

    if (assetId) {

      let assetMeasuresInEngine = assetMeasuresInEngineCache[engineId];

      if (! assetMeasuresInEngine) {
        assetMeasuresInEngine = {};
        assetMeasuresInEngineCache[engineId] = assetMeasuresInEngine;
      }

      assetCacheEntity = assetMeasuresInEngine[assetId];
      if (! assetCacheEntity) {
        assetCacheEntity = {
          asset: await this.assetService.getAsset(engineId, assetId),
          measures: [],
        };
        assetMeasuresInEngine[assetId] = assetCacheEntity;
      }
    }

    // Search for engine in cache or see if index exist
    let engineMeasures = null;
    if (engineId !== this.config.adminIndex) {
      engineMeasures = engineMeasuresCache[engineId];

      if (! engineMeasures) {
        engineMeasures = [];
        engineMeasuresCache[engineId] = engineMeasures;
      }
    }

    for (const measurement of measurements) {
      // Get type
      if (! this.measuresRegister.has(measurement.type)) {
        unknownTypeMeasurements.push(measurement);
      }
      else {
        // Refine measurements in measures
        const deviceMeasureName = measurement.deviceMeasureName ?? measurement.type;

        const assetMeasureName = this.findAssetMeasureName(
          deviceId,
          measurement.deviceMeasureName,
          assetCacheEntity);

        const measureContent: MeasureContent = {
          assetMeasureName,
          deviceMeasureName,
          measuredAt: measurement.measuredAt,
          origin: {
            assetId,
            deviceModel,
            id: deviceId,
            payloadUuids,
            type: OriginType.DEVICE,
          },
          type: measurement.type,
          unit: this.measuresRegister.get(measurement.type).unit,
          values: measurement.values,
        };

        // Insert measures in cache structs
        if (engineMeasures) {
          engineMeasures.push(measureContent);
        }

        if (assetMeasureName) {
          assetCacheEntity.measures.push(measureContent);
        }

        deviceMeasures.measures.push(measureContent);
      }
    }
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
   * @param {object} options
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
    const eventId = `${MeasureService.eventId}:registerByAsset`;

    const invalidMeasurements: JSONObject[] = [];
    const validMeasures: MeasureContent[] = [];

    const asset = await this.assetService.getAsset(engineId, assetId);

    if (! asset) {
      throw new NotFoundError(`Asset ${assetId} does not exist`);
    }

    for (const jsonMeasurement of jsonMeasurements) {
      if (this.validateAssetMeasurement(jsonMeasurement)
        && this.measuresRegister.has(jsonMeasurement.type)) {
        const measurement = jsonMeasurement as AssetMeasurement;

        validMeasures.push({
          assetMeasureName: measurement.assetMeasureName,
          deviceMeasureName: null,
          measuredAt: measurement.measuredAt ? measurement.measuredAt : Date.now(),
          origin: {
            assetId: null,
            id: kuid,
            type: OriginType.USER,
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

    const response = await this.app.trigger(`${eventId}:before`, {
      asset,
      engineId,
      invalidMeasurements,
      validMeasures,
    });

    await this.sdk.document.update(
      engineId,
      InternalCollection.ASSETS,
      asset._id,
      { measures: response.asset._source.measures }
    );

    await this.historizeEngineMeasures(engineId, validMeasures, { refresh });

    await this.app.trigger(`${eventId}:after`, {
      asset,
      engineId,
      invalidMeasurements,
      validMeasures,
    });

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
      && _.has(toValidate, 'assetMeasureName')
      && _.has(toValidate, 'type')
      && this.measuresRegister.has(toValidate.type);
  }

  private findAssetMeasureName (
    deviceId: string,
    deviceMeasureName: string,
    assetMeasures: { asset: BaseAsset, measures: MeasureContent[] }
  ): string {
    if (assetMeasures) {
      const link = assetMeasures.asset._source.deviceLinks.find(
        deviceLink => deviceLink.deviceId === deviceId);

      if (link) {
        const measureNameLink = link.measureNamesLinks.find(
          nameLink => nameLink.deviceMeasureName === deviceMeasureName);

        if (measureNameLink) {
          return measureNameLink.assetMeasureName;
        }
      }
    }

    return null;
  }
}
