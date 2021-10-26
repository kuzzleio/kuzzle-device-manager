import {
  EmbeddedSDK,
  Plugin,
} from 'kuzzle';

import { CRUDController } from './CRUDController';
import { DecodersService } from '../core-classes';

export class DecodersController extends CRUDController {
  private decodersService: DecodersService;

  get sdk(): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor(plugin: Plugin, decodersService: DecodersService) {
    super(plugin, 'decoders');

    this.decodersService = decodersService;

    this.definition = {
      actions: {
        list: {
          handler: this.list.bind(this),
          http: [{ verb: 'get', path: 'device-manager/decoders' }]
        }
      }
    };
  }

  /**
   * List all available decoders
   */
  async list () {
    const decoders = await this.decodersService.list();

    return { decoders };
  }

}
