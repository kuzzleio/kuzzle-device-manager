import {
  KuzzleRequest,
  PluginContext,
  Backend,
  UnauthorizedError,
} from 'kuzzle';
import { v4 as uuidv4 } from 'uuid';
import { BatchController } from 'kuzzle-sdk';

import { Decoder } from './Decoder';
import { Device, BaseAsset } from '../models';
import {
  Measure,
  DeviceContent,
  DeviceManagerConfiguration,
  BaseAssetContent,
} from '../types';
import { DeviceManagerPlugin } from '../DeviceManagerPlugin';
import { MeasureService } from './MeasureService';
import { MeasuresRegister } from './registers/MeasuresRegister';

export class PayloadService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private batch: BatchController;
  private measuresRegister: MeasuresRegister;
  private measureService: MeasureService;

  private get sdk () {
    return this.context.accessors.sdk;
  }

  private get app (): Backend {
    return global.app;
  }

  constructor (
    plugin: DeviceManagerPlugin,
    batchController: BatchController,
    measuresRegister: MeasuresRegister,
    measureService: MeasureService
  ) {
    this.config = plugin.config as any;
    this.context = plugin.context;
    this.measureService = measureService;
    this.measuresRegister = measuresRegister;

    this.batch = batchController;
  }

  async process (request: KuzzleRequest, decoder: Decoder, { refresh = undefined } = {}) {
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

    const newMeasures: Measure[] = [];

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
      return await this.measureService.registerByDevice(
        deviceId, newMeasures, { refresh });
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
    measures: Measure[],
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
      measures: measures,
      measuresName: [],
      model: model,
      reference: reference,
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

  private async getAsset (engineId: string, assetId: string) {
    const document = await this.batch.get<BaseAssetContent>(engineId, 'assets', assetId);

    return new BaseAsset(document._source, document._id);
  }

  private async getDevice (deviceId: string) {
    const document = await this.batch.get<DeviceContent>(
      this.config.adminIndex,
      'devices',
      deviceId);

    return new Device(document._source, document._id);
  }
}
