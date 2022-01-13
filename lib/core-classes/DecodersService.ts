import { PluginContext, EmbeddedSDK, Plugin, ControllerDefinition } from 'kuzzle';

import { Decoder } from './Decoder';
import { DecoderContent } from '../types/DecoderContent';
import { DeviceManagerConfig } from '../DeviceManagerPlugin';
import { PayloadHandler } from 'index';
import { PayloadService } from './PayloadService';

export class DecodersService {
  private config: DeviceManagerConfig;
  private context: PluginContext;

  private _decoders: Map<string, Decoder>;
  private handlers: { decoder: Decoder, handler: PayloadHandler }[];

  get sdk(): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  get decoders(): Map<string, Decoder> {
    return this._decoders;
  }

  constructor(plugin: Plugin, decoders: { decoder: Decoder, handler: PayloadHandler }[]) {
    this.config = plugin.config as any;
    this.context = plugin.context;
    this.handlers = decoders
    this._decoders = new Map();


    for (const { decoder } of this.handlers) {
      this.register(decoder);
    }

    this.printDecoders();
  }

  async list(): Promise<DecoderContent[]> {
    const decoders = Array
      .from(this._decoders.values())
      .map(decoder => decoder.serialize())

    return decoders;
  }

  register(decoder: Decoder): void {
    this.decoders.set(decoder.deviceModel, decoder);
  }

  buildPayloadController(payloadService: PayloadService): ControllerDefinition {
    const controllers: ControllerDefinition = { actions: {} };
    for (const { decoder, handler } of this.handlers) {
      controllers.actions[decoder.action] = {
        handler: request => handler ? handler(request, decoder) : payloadService.process(request, decoder),
        http: decoder.http,
      };
    }

    return controllers;
  }

  private printDecoders(): void {
    for (const decoder of this._decoders.values()) {
      this.context.log.info(`Register API action "device-manager/payload:${decoder.action}" with decoder "${decoder.constructor.name}" for device "${decoder.deviceModel}"`);
    }
  }
}
