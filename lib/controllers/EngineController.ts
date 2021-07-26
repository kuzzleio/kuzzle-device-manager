import {
  ControllerDefinition,
  PluginContext,
  KuzzleRequest,
  EmbeddedSDK,
  JSONObject,
} from 'kuzzle';

import { EngineService } from '../services';

export class EngineController {
  private engineService: EngineService;
  private context: PluginContext;
  private config: JSONObject;

  public definition: ControllerDefinition;

  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor (config: JSONObject, context: PluginContext, engineService: EngineService) {
    this.config = config;
    this.context = context;
    this.engineService = engineService;

    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ verb: 'post', path: 'device-manager/engine/:index' }],
        },
        update: {
          handler: this.update.bind(this),
          http: [{ verb: 'put', path: 'device-manager/engine/:index' }],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/engine/:index' }],
        },
        list: {
          handler: this.list.bind(this),
          http: [{ verb: 'get', path: 'device-manager/engines' }],
        },
        exists: {
          handler: this.exists.bind(this),
          http: [{ verb: 'get', path: 'device-manager/engine/:index/_exists' }],
        }
      },
    };
  }

  async create (request: KuzzleRequest) {
    const index = request.getIndex();
    const group = request.getString('group', 'commons');

    const { collections } = await this.engineService.create(index, group);

    return { index, collections };
  }

  async update (request: KuzzleRequest) {
    const index = request.getIndex();
    const group = request.getString('group', 'commons');

    const { collections } = await this.engineService.update(index, group);

    return { index, collections };
  }

  async delete (request: KuzzleRequest) {
    const index = request.getIndex();

    const { collections } = await this.engineService.delete(index);

    return { index, collections };
  }

  async list () {
    return this.engineService.list();
  }

  async exists (request: KuzzleRequest) {
    const index = request.getIndex();

    const exists = await this.engineService.exists(index);

    return { exists };
  }
}
