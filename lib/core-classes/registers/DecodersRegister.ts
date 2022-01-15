import {
  ControllerDefinition,
  PluginImplementationError,
  KuzzleRequest,
  Inflector
} from 'kuzzle';

import { Decoder } from '../Decoder';
import { DecoderContent } from '../../types/DecoderContent';
import { PayloadService } from '../PayloadService';

export class DecodersRegister {
  private _decoders = new Map<string, Decoder>();

  get decoders (): Decoder[] {
    return Array.from(this._decoders.values());
  }

  async list (): Promise<DecoderContent[]> {
    const decoders = this.decoders.map(decoder => decoder.serialize());

    return decoders;
  }

  /**
   * Registers a new decoder for a device model.
   *
   * This will register a new API action:
   *  - controller: `device-manager/payload`
   *  - action: `action` property of the decoder or the device model in kebab-case
   *
   * @param decoder Instantiated decoder
   *
   * @returns Corresponding API action requestPayload
   */
  register (decoder: Decoder) {
    decoder.action = decoder.action || Inflector.kebabCase(decoder.deviceModel);

    if (this._decoders.has(decoder.deviceModel)) {
      throw new PluginImplementationError(`Decoder for device model "${decoder.deviceModel}" already registered`);
    }

    this._decoders.set(decoder.deviceModel, decoder);

    return {
      action: decoder.action,
      controller: 'device-manager/payload',
    };
  }

  /**
   * Build the PayloadController with registered decoders
   *
   * @todo generate OpenAPI specification
   *
   * @internal
   */
  getPayloadController (payloadService: PayloadService): ControllerDefinition {
    const controllers: ControllerDefinition = { actions: {} };

    for (const decoder of this.decoders) {
      controllers.actions[decoder.action] = {
        handler: async (request: KuzzleRequest) => {
          const source = request.getBoolean('source');

          const ret = await payloadService.process(request, decoder);

          return source ? ret : undefined;
        },
        http: decoder.http,
      };
    }

    return controllers;
  }
}
