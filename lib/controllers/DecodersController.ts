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
          http: [{ verb: 'get', path: 'device-manager/decoders/_list' }]
        }
      }
    };
  }

  /**
   * List all available decoders
   */
  async list () {
    const decoders = this.decodersService.list();

    return decoders;
  }

}
