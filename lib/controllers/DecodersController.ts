import { Plugin } from 'kuzzle';

import { CRUDController } from './CRUDController';
import { DecodersRegister } from '../core-classes';

export class DecodersController extends CRUDController {
  private decodersRegister: DecodersRegister;

  get sdk () {
    return this.context.accessors.sdk;
  }

  constructor (plugin: Plugin, decodersRegister: DecodersRegister) {
    super(plugin, 'decoders');

    this.decodersRegister = decodersRegister;

    this.definition = {
      actions: {
        list: {
          handler: this.list.bind(this),
          http: [{ path: 'device-manager/decoders', verb: 'get' }]
        }
      }
    };
  }

  /**
   * List all available decoders
   */
  async list () {
    const decoders = await this.decodersRegister.list();

    return { decoders };
  }

}
