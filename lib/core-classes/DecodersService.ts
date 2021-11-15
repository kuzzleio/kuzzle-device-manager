import { PayloadService } from './PayloadService';
import { PluginContext, EmbeddedSDK, Plugin } from "kuzzle";

import { Decoder } from "./Decoder";
import { DeviceManagerConfig } from "../DeviceManagerPlugin";
import { DecoderContent } from '../types/decoders/DecodersContent';

export class DecodersService {
  private config: DeviceManagerConfig;
  private context: PluginContext;

  private _decoders: Map<string, Decoder>;
  private handlers: any[];

  get sdk(): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  get decoders(): Map<string, Decoder> {
    return this._decoders;
  }

  constructor(plugin: Plugin, decoders: any[]) {
    this.config = plugin.config as any;
    this.context = plugin.context;

    this.handlers = decoders
    this._decoders = new Map();

    for (const { decoder } of decoders) {
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

  printDecoders() {
    for (const decoder of this._decoders.values()) {
      this.context.log.info(`Register API action "device-manager/payload:${decoder.action}" with decoder "${decoder.constructor.name}" for device "${decoder.deviceModel}"`);
    }
  }

  register(decoder: Decoder) {
    this.decoders.set(decoder.deviceModel, decoder);
  }

  registerPayloadController(api, payloadService: PayloadService) {
    for (const { decoder, handler } of this.handlers) {
      api['device-manager/payload'].actions[decoder.action] = {
        handler: request => handler ? handler(request, decoder) : payloadService.process(request, decoder),
        http: decoder.http,
      };
    }
  }
}
