import {
  Backend,
  BatchController,
  JSONObject,
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
  private static eventId = 'MeasureService';

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
   * @TODO add before/afterUpdate
   */
  public async registerByDecodedPayload (
    deviceModel: string,
    decodedPayloads: DecodedPayload,
    payloadUuid: string,
    { provisionDevice, refresh }:
    {
      provisionDevice?: boolean,
      refresh?: string
    } = {}
  ) {
    const eventId = `${MeasureService.eventId}:registerByDecodedPayload`;
    // TODO : Realtime event

    // Sorting structs
    const measuresByEngine: Map<string, MeasureContent[]> = new Map();

    const assetMeasuresByEngineAndId: Map<string, Map<string, {
      asset: BaseAsset, measures: MeasureContent[],
    }>> = new Map();

    const deviceMeasuresByEngineAndId: Map<string, Map<string, {
      device: Device, measures: MeasureContent[],
    }>> = new Map();

    const measures: MeasureContent[] = [];

    const measurementsWithoutDevice: Map<string, Measurement[]> = new Map();

    const unaivailableTypeMeasurements: Measurement[] = [];

    // By device
    for (const [reference, measurements] of decodedPayloads.entries()) {
      const deviceId = Device.id(deviceModel, reference);
      let device = await this.deviceService.getDevice(this.config, deviceId);

      // Search for device
      if (!device) {
        if (provisionDevice) {
          // device = 
          // TODO : Create real measure and create the device
          // this.deviceService.create({
          //   model: deviceModel,
          //   reference,
          // }, { measures });
        }
        else {
          measurementsWithoutDevice.set(reference, measurements);
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
          }
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
        const measureType = this.measuresRegister.get(measurement.type);
        if (! measureType) {
          unaivailableTypeMeasurements.push(measurement);
          continue;
        }

        // Refine measurements in measures
        let assetMeasureName = null;

        if (assetMeasures) {
          const link = assetMeasures.asset._source.deviceLinks.find(
            deviceLink => deviceLink.deviceId === deviceId);

          if (link) {
            const measureNameLink = link.measuresNameLinks.find(
              measureNameLink =>
              measureNameLink.deviceMeasureName === measurement.deviceMeasureName);

            if (measureNameLink) {
              assetMeasureName = measureNameLink.assetMeasureName;
            }
          }
        }

        const measureContent: MeasureContent = {
          type: measurement.type,
          values: measurement.values,
          measuredAt: measurement.measuredAt,
          deviceMeasureName: measurement.deviceMeasureName,
          unit: this.measuresRegister.get(measurement.type).unit,
          originType: OriginType.DEVICE,
          payloadUuids: payloadUuid,
          deviceModel,
          deviceId,
          assetId,
          assetMeasureName,
        };

        // TODO : See if stock in Admin engine
        //
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
      measuresByEngine,
      assetMeasuresByEngineAndId,
      deviceMeasuresByEngineAndId,
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
        );
      }
    }

    this.sdk.document.mUpdate(
      this.config.adminIndex,
      InternalCollection.DEVICES,
      devices.map(
        device => ({ _id: device._id, body: device._source })),
    );

    await this.app.trigger(`${eventId}:after`, {
      measuresByEngine,
      assetMeasuresByEngineAndId,
      deviceMeasuresByEngineAndId,
    });


    return {
      // TOSEE : What to return ?
      // TOSEE : Stock updated assets, devices and measures for return result ?
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
    jsonMeasurements: JSONObject[],
    refresh: string,
    strict: boolean
  ) {
    const refreshableCollections = [
      [this.config.adminIndex, InternalCollection.ASSETS],
      [engineId, InternalCollection.MEASURES]
    ];

    const invalidMeasurements: JSONObject[] = [];
    const validMeasurements: MeasureContent[] = [];

    for (const jsonMeasurement of jsonMeasurements) {
      if (validateAssetMeasurement(measurement) && this.measuresRegister.has(measurement.type)) {
        const measurement = jsonMeasurement as AssetMeasurement;

        validMeasurements.push({
          type: measurement.type,
          values: measurement.values,
          measuredAt: measurement.measuredAt ? measurement.measuredAt : Date.now(),
          deviceMeasureName: null,
          unit: this.measuresRegister.get(measurement.type).unit,
          originType: OriginType.ASSET,
          payloadUuids: null,
          deviceModel: null,
          deviceId: null,
          assetId: null,
          assetMeasureName: measurement.assetMeasureName,
        });
      }
      else {
        invalidMeasurements.push(jsonMeasurement);
      }
    }

    if (strict && invalidMeasurements.length) {
      throw new PluginImplementationError(`Some measure pushed by asset ${assetId} are invalid, all has been blocked`);
    }

    const asset = await this.assetService.getAsset(engineId, assetId);

    if (! validMeasurements.length) {
      return {
        asset: asset.serialize(),
        engineId,
        errors: invalidMeasurements
      };
    }

    const updatedAsset = await this.assetService.TODO-use-model-updateMeasures(
      engineId,
      asset,
      validMeasurements);

    await this.historizeEngineMeasures(engineId, validMeasurements);

    if (refresh === 'wait_for') {
      await Promise.all(refreshableCollections.map(([index, collection]) => (
        this.sdk.collection.refresh(index, collection)
      )));
    }

    return {
      asset: updatedAsset ? updatedAsset.serialize() : null,
      engineId,
      errors: invalidMeasurements
    };
  }

  private async historizeEngineMeasures (
    engineId: string,
    newMeasures: MeasureContent[],
    { refresh }: { refresh?: string }
  ) {
    await Promise.all(newMeasures.map(measure => {
      return this.batch.create<MeasureContent>(engineId,
        InternalCollection.MEASURES,
        measure,
        refresh);
    }));
  }

  private validateAssetMeasurement (toValidate: JSONObject): boolean {
    return _.has(toValidate, 'values')
      && _.has(toValidate, 'assetMeasureName')
      && _.has(toValidate, 'type')
      && this.measuresRegister.has(toValidate.type);
  }
}
