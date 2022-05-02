import _ from 'lodash';
import {
  KuzzleRequest,
  PluginContext,
  BadRequestError,
  Backend,
  UnauthorizedError,
} from 'kuzzle';
import { v4 as uuidv4 } from 'uuid';
import { BatchController } from 'kuzzle-sdk';

import { Decoder } from './Decoder';
import { Device, BaseAsset } from '../models';
import {
  MeasureContent,
  DeviceContent,
  DeviceManagerConfiguration,
  BaseAssetContent,
} from '../types';
import { MeasuresRegister } from './registers/MeasuresRegister';
import { DeviceManagerPlugin } from '../DeviceManagerPlugin';

export class PayloadService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private measuresRegister: MeasuresRegister;
  private batch: BatchController;

  private get sdk () {
    return this.context.accessors.sdk;
  }

  private get app (): Backend {
    return global.app;
  }

  constructor (plugin: DeviceManagerPlugin, measuresRegister: MeasuresRegister) {
    this.config = plugin.config as any;
    this.context = plugin.context;
    this.measuresRegister = measuresRegister;

    this.batch = new BatchController(this.sdk as any, {
      interval: plugin.config.batchInterval
    });
  }

  async process (request: KuzzleRequest, decoder: Decoder, { refresh=undefined } = {}) {
    const payload = request.getBody();

    const uuid = request.input.args.uuid || uuidv4();
    let valid = true;

    try {
      valid = await decoder.validate(payload, request);

      if (! valid) {
        return { valid };
      }
    }
    catch (error) {
      valid = false;
      throw error;
    }
    finally {
      await this.batch.create(
        this.config.adminIndex,
        'payloads',
        {
          deviceModel: decoder.deviceModel,
          payload,
          uuid,
          valid,
        },
        uuid);
    }

    const decodedPayload = await decoder.decode(payload, request);

    const newMeasures: MeasureContent[] = [];

    const deviceId = Device.id(decoder.deviceModel, decodedPayload.reference);

    for (const [type, measure] of Object.entries(decodedPayload.measures)) {
      newMeasures.push({
        measuredAt: measure.measuredAt,
        origin: {
          assetId: null,
          id: deviceId,
          model: decoder.deviceModel,
          payloadUuids: [uuid],
          type: 'device',
        },
        type,
        unit: this.measuresRegister.get(type).unit,
        values: measure.values
      });
    }

    try {
      const deviceDoc = await this.batch.get<DeviceContent>(
        this.config.adminIndex,
        'devices',
        deviceId);

      const device = new Device(deviceDoc._source);

      if (device._source.assetId) {
        for (const measure of newMeasures) {
          measure.origin.assetId = device._source.assetId;
        }
      }

      return await this.update(device, newMeasures, { refresh });
    }
    catch (error) {
      if (error.id === 'services.storage.not_found') {
        return this.provisionning(
          decoder.deviceModel,
          decodedPayload.reference,
          newMeasures,
          { refresh });
      }

      throw error;
    }
  }

  private async provisionning (
    model: string,
    reference: string,
    measures: MeasureContent[],
    { refresh },
  ) {
    const pluginConfig = await this.batch.get(
      this.config.adminIndex,
      this.config.adminCollections.config.name,
      'plugin--device-manager');

    const autoProvisioning
      = pluginConfig._source['device-manager'].provisioningStrategy === 'auto';

    if (! autoProvisioning) {
      throw new UnauthorizedError(`The device model "${model}" with reference "${reference}" is not registered on the platform.`);
    }

    const deviceId = Device.id(model, reference);
    const deviceContent: DeviceContent = {
      measures,
      model,
      reference,
    };

    return this.register(deviceId, deviceContent, { refresh });
  }

  /**
   * Register a new device by creating the document in admin index
   * @todo add before/afterRegister events
   */
  private async register (deviceId: string, deviceContent: DeviceContent, { refresh }) {
    const deviceDoc = await this.batch.create<DeviceContent>(
      this.config.adminIndex,
      'devices',
      deviceContent,
      deviceId,
      { refresh });

    const device = new Device(deviceDoc._source);

    return {
      asset: null,
      device: device.serialize(),
      engineId: device._source.engineId,
    };
  }


  /**
   * Updates the device with the new measures:
   *  - in admin index
   *  - in engine index
   *  - in linked asset
   *  - historize measures in engine index
   *
   * @todo add before/afterUpdate events
   */
  private async update (
    device: Device,
    newMeasures: MeasureContent[],
    { refresh },
  ) {
    const refreshableCollections = [];

    const updatedDevice = await this.updateDevice(device, newMeasures);

    refreshableCollections.push([this.config.adminIndex, 'devices']);

    const engineId = updatedDevice._source.engineId;
    let updatedAsset: BaseAsset = null;

    // Propagate device into tenant index
    if (engineId) {
      await this.historizeMeasures(engineId, newMeasures);

      await this.batch.update<DeviceContent>(
        engineId,
        'devices',
        updatedDevice._id,
        updatedDevice._source,
        { retryOnConflict: 10 });

      refreshableCollections.push([engineId, 'devices']);

      // Propagate measures into linked asset
      const assetId = updatedDevice._source.assetId;

      if (assetId) {
        updatedAsset = await this.propagateToAsset(engineId, newMeasures, assetId);

        refreshableCollections.push([engineId, 'assets']);
      }
    }

    if (refresh === 'wait_for') {
      await Promise.all(refreshableCollections.map(([index, collection]) => (
        this.sdk.collection.refresh(index, collection)
      )));
    }

    return {
      asset: updatedAsset ? updatedAsset.serialize() : null,
      device: device.serialize(),
      engineId,
    };
  }

  /**
   * Updates a device with the new measures
   *
   * @returns Updated device
   */
  private async updateDevice (
    device: Device,
    newMeasures: MeasureContent[],
  ): Promise<Device> {
    // dup array reference
    const measures = newMeasures.map(m => m);

    // Keep previous measures that were not updated
    for (const previousMeasure of device._source.measures) {
      if (! measures.find(m => m.type === previousMeasure.type)) {
        measures.push(previousMeasure);
      }
    }

    device._source.measures = measures;

    const result = await global.app.trigger(
      `engine:${device._source.engineId}:device:measures:new`,
      { device, measures: newMeasures });

    const deviceDocument = await this.batch.update<DeviceContent>(
      this.config.adminIndex,
      'devices',
      result.device._id,
      result.device._source,
      { retryOnConflict: 10, source: true });

    return new Device(deviceDocument._source);
  }

  /**
   * Save measures in engine "measures" collection
   */
  private async historizeMeasures (engineId: string, measures: MeasureContent[]) {
    await Promise.all(measures.map(measure => {
      return this.batch.create<MeasureContent>(engineId, 'measures', measure);
    }));
  }

  /**
   * Propagate the measures inside the linked asset document.
   */
  private async propagateToAsset (
    engineId: string,
    newMeasures: MeasureContent[],
    assetId: string
  ): Promise<BaseAsset> {
    // dup array reference
    const measures = newMeasures.map(m => m);

    const asset = await this.batch.get<BaseAssetContent>(
      engineId,
      'assets',
      assetId);

    if (! _.isArray(asset._source.measures)) {
      throw new BadRequestError(`Asset "${assetId}" measures property is not an array.`);
    }

    // Keep previous measures that were not updated
    // array are updated in place so we need to keep previous elements
    for (const previousMeasure of asset._source.measures) {
      if (! measures.find(m => m.type === previousMeasure.type)) {
        measures.push(previousMeasure);
      }
    }

    asset._source.measures = measures;

    // Give the list of new measures types in event payload
    const result = await global.app.trigger(
      `engine:${engineId}:asset:measures:new`,
      { asset, measures: newMeasures });

    const assetDocument = await this.batch.update<BaseAssetContent>(
      engineId,
      'assets',
      assetId,
      result.asset._source,
      { retryOnConflict: 10, source: true });

    return new BaseAsset(assetDocument._source as any, assetDocument._id);
  }
}
