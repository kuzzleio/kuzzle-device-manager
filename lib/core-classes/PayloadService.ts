import {
  Backend,
  BatchController,
  KuzzleRequest,
  PluginContext,
} from 'kuzzle';
import { v4 as uuidv4 } from 'uuid';

import { Decoder } from './Decoder';
import { Device } from '../models';
import {
  DeviceContent,
  DeviceManagerConfiguration,
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

  /**
   * Process a payload by validating and decode it with the `decoder` associated
   * with the device model. It :
   * - register the brut `Payload`
   * - redirect measurements to MeasureService
   */
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

    const decodedPayloads = await decoder.decode(payload, request);

    for (const { deviceReference, measurements } of decodedPayloads) {
      this.measureService.registerByDevice(
        decoder.deviceModel,
        deviceReference,
        measurements,
        uuid,
        { refresh });
    }

    // TODO : refresh the payload if needed

    // TODO : Try in Measure Service maybe ?
    try {
      return await this.measureService.registerByDevice(decoder.deviceModel, decodedPayloads, {
        refresh
      });
    }
    catch (error) {
      if (error.id === 'services.storage.not_found') {
        // TODO : Where to register a new device ? (in Device Service)
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
      measuresName: [],
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
}
