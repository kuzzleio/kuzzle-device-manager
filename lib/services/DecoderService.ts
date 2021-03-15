import {
  JSONObject,
  PluginContext,
  EmbeddedSDK,
} from 'kuzzle';

import { Decoder } from '../decoders'

export class DecoderService {
  private config: JSONObject;

  /**
   * List of registered decoders.
   * Map<model, decoder>
   */
  private decoders = new Map<string, Decoder>();

  constructor(config: JSONObject) {
    this.config = config;
  }

  get values() {
    return this.decoders.values();
  }

  add (model: string, decoder: Decoder): void {
    this.decoders.set(model, decoder);
  }

  getModel (model: string): Decoder {
    return this.decoders.get(model);
  }
}
