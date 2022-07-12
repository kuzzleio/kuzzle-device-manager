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
   * @param payloadUuid Payload Uuid that generated the measurements
   * @param {object} options
   * @param options.provisionDevice If true and a `decodedPayload`
   * reference a nonexisting device, create this device
   * @param options.refresh Wait for ES indexation
   */
  public async registerByDecodedPayload (
    deviceModel: string,
    decodedPayloads: DecodedPayload,
    payloadUuid: string,
    { autoProvisionDevice, refresh }:
    {
      autoProvisionDevice?: boolean,
      refresh?: 'wait_for' | 'false',
    } = {}
  ) {
    const eventId = `${MeasureService.eventId}:registerByDecodedPayload`;

    // Sorting structs
    const measuresByEngine: Map<string, // engineId
      MeasureContent[]> = new Map();

    const assetMeasuresByEngineAndId: Map<string, // engineId
      Map<string,                                 // collectionId
      {
        asset: BaseAsset, measures: MeasureContent[],
      }>> = new Map();

    const deviceMeasuresByEngineAndId: Map<string,  // engineId
      Map<string,                                   // collectionId
      {                 
        device: Device, measures: MeasureContent[],
      }>> = new Map();

    const measurementsWithoutDevice: Map<string,  // deviceId
      Measurement[]> = new Map();

    const unaivailableTypeMeasurements: Measurement[] = [];

    // By device
    for (const [reference, measurements] of decodedPayloads.entries()) {
      const deviceId = Device.id(deviceModel, reference);
      let device = null;

      // Search for device
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
          measurementsWithoutDevice.set(reference, measurements);
          continue;
        }
      }

      const engineId = device._source.engineId;
      const assetId = device._source.assetId;

      // Search for device
      let deviceMeasures: { device: Device, measures: MeasureContent[] } = { device, measures: [] };
      let deviceMeasuresInEngine = deviceMeasuresByEngineAndId.get(engineId);
      if (! deviceMeasuresInEngine) {
        deviceMeasuresInEngine = new Map([[deviceId, deviceMeasures]]);
        deviceMeasuresByEngineAndId.set(engineId, deviceMeasuresInEngine);
      }

      // Search for asset
      let assetMeasures: { asset: BaseAsset, measures: MeasureContent[] } = null;
      if (device._source.assetId) {
        let assetMeasuresInEngine = assetMeasuresByEngineAndId.get(device._source.engineId);

        if (! assetMeasuresInEngine) {
          assetMeasuresInEngine = new Map();
          assetMeasuresByEngineAndId.set(engineId, assetMeasuresInEngine);
        }

        assetMeasures = assetMeasuresInEngine.get(assetId);
        if (! assetMeasures) {
          assetMeasures = {
            asset: await this.assetService.getAsset(engineId, assetId),
            measures: []
          };
          assetMeasuresInEngine.set(assetId, assetMeasures);
        }
      }

      // Search for engine
      let engineMeasures = null;
      if (engineId) {
        engineMeasures = measuresByEngine.get(engineId);

        if (! engineMeasures) {
          // TOSEE : Check if engine exist or assert the propagation is always right
          engineMeasures = [];
          measuresByEngine.set(engineId, engineMeasures);
        }
      }

      for (const measurement of measurements) {
        // Get type
        if (! this.measuresRegister.has(measurement.type)) {
          unaivailableTypeMeasurements.push(measurement);
          continue;
        }

        // Refine measurements in measures
        let assetMeasureName = null;

        if (assetMeasures) {
          const link = assetMeasures.asset._source.deviceLinks.find(
            deviceLink => deviceLink.deviceId === deviceId);

          if (link) {
            const measureNameLink = link.measureNamesLinks.find(
              nameLink =>
              nameLink.deviceMeasureName === measurement.deviceMeasureName);

            if (measureNameLink) {
              assetMeasureName = measureNameLink.assetMeasureName;
            }
          }
        }

        const measureContent: MeasureContent = {
          assetMeasureName,
          deviceMeasureName: measurement.deviceMeasureName,
          measuredAt: measurement.measuredAt,
          origin: {
            assetId,
            deviceModel,
            id: deviceId,
            payloadUuid,
            type: OriginType.DEVICE,
          },
          type: measurement.type,
          unit: this.measuresRegister.get(measurement.type).unit,
          values: measurement.values,
        };

        // Insert measures in sort structs
        if (engineMeasures) {
          engineMeasures.push(measureContent);
        }

        if (assetMeasureName) {
          assetMeasures.measures.push(measureContent);
        }

        if (device) {
          deviceMeasures.measures.push(measureContent);
        }
      }
    }

    const response = await this.app.trigger(`${eventId}:before`, {
      assetMeasuresByEngineAndId,
      deviceMeasuresByEngineAndId,
      measurementsWithoutDevice,
      measuresByEngine,
      unaivailableTypeMeasurements,
    });

    // Push measures
    // Engine
    for (const [engineId, measures] of response.measuresByEngine.entries()) {
      await this.historizeEngineMeasures(engineId, measures, { refresh });
    }

    // Asset
    for (const [engineId, assetMeasuresMap] of response.assetMeasuresByEngineAndId.entries()) {
      for (const { asset, measures } of assetMeasuresMap.values()) {
        asset.updateMeasures(measures);
      }

      this.sdk.document.mUpdate(
        engineId,
        InternalCollection.ASSETS,
        Array.from(assetMeasuresMap.values()).map(
          ({ asset }) => ({ _id: asset._id, body: asset._source })),
        { refresh }
      );
    }

    // Device
    const devices: Device[] = [];
    for (const [engineId, deviceMeasuresMap] of response.deviceMeasuresByEngineAndId.entries()) {
      for (const { device, measures } of deviceMeasuresMap.values()) {
        device.updateMeasures(measures);
        devices.push(device);
      }

      if (engineId) {
        this.sdk.document.mUpdate(
          engineId,
          InternalCollection.DEVICES,
          Array.from(deviceMeasuresMap.values()).map(
            ({ device }) => ({ _id: device._id, body: device._source })),
          { refresh }
        );
      }
    }

    this.sdk.document.mUpdate(
      this.config.adminIndex,
      InternalCollection.DEVICES,
      devices.map(
        device => ({ _id: device._id, body: device._source })),
      { refresh }
    );

    await this.app.trigger(`${eventId}:after`, {
      assetMeasuresByEngineAndId,
      deviceMeasuresByEngineAndId,
      measuresByEngine,
    });

    return {
      // TOSEE : What to return, how (serialization) ?
      // TOSEE : Stock updated assets, devices and measures for return result ?
      // measuresByEngine,
      // assetMeasuresByEngineAndId,
      // deviceMeasuresByEngineAndId,
      // unaivailableTypeMeasurements,
      // measurementsWithoutDevice,
    };
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
            type: OriginType.ASSET,
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

    this.sdk.document.update(
      engineId,
      InternalCollection.ASSETS,
      asset._id,
      { measures: response.asset._source.measures }
    );

    await this.historizeEngineMeasures(engineId, validMeasures, { refresh });

    this.app.trigger(`${eventId}:after`, {
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
}
