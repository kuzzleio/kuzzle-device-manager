import { PluginContext, EmbeddedSDK, Plugin } from "kuzzle";

import { Decoder } from "./Decoder";
import { DeviceManagerConfig } from "../DeviceManagerPlugin";
import { DecoderConstructor } from '../types/DecodersContent';

export class DecodersService {
  private config: DeviceManagerConfig;
  private context: PluginContext;

  private decoders: Map<string, Decoder>;

  get sdk(): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor(plugin: Plugin, decoders: Map<string, Decoder>) {
    this.config = plugin.config as any;
    this.context = plugin.context;

    this.decoders = decoders;
  }

  async list(): Promise<DecoderConstructor[]> {
    const decoders = Decoder.serialize(this.decoders);

    return decoders;
  }
}
