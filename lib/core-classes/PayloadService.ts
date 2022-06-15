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

    for (const _ of decodedPayloads) {
      this.measureService.registerByDecodedPayload(
        decoder.deviceModel,
        decodedPayloads,
        uuid,
        { refresh });
    }

    return await this.measureService.registerByDecodedPayload(decoder.deviceModel, decodedPayloads, {
      refresh
    });
  }
}
