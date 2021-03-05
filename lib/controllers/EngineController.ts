import {
  ControllerDefinition,
  PluginContext,
  KuzzleRequest,
  EmbeddedSDK,
  BadRequestError,
  JSONObject,
} from 'kuzzle';

import { NativeController } from 'kuzzle/lib/api/controllers/baseController.js'

export class EngineController extends NativeController {
  [key: string]: any;

  public definition: ControllerDefinition;

  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor (config: JSONObject, context: PluginContext) {
    super();

    this.config = config;
    this.context = context;

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
          http: [{ verb: 'get', path: 'device-manager/engine' }],
        },
        exists: {
          handler: this.exists.bind(this),
          http: [{ verb: 'get', path: 'device-manager/engine/:index/_exists' }],
        }
      },
    };
  }

  async create (request: KuzzleRequest) {
    const index = this.getIndex(request);

    const collections = this.config.collections;

    const promises = [];

    for (const [collection, mappings] of Object.entries(collections)) {
      promises.push(this.sdk.collection.create(index, collection, { mappings }));
    }

    await Promise.all(promises);

    await this.sdk.document.create(
      this.config.adminIndex,
      'engines',
      { index },
      index,
      { refresh: 'wait_for' })

    return { index, collections };
  }

  async update (request: KuzzleRequest) {
    const index = this.getIndex(request);

    const { result: tenantExists } = await this.sdk.query({
      controller: 'device-manager/engine',
      action: 'exists',
      index,
    });

    if (! tenantExists) {
      throw new BadRequestError(`Tenant "${index}" does not have a device-manager engine`);
    }

    const collections = this.config.collections;

    const promises = [];

    for (const [collection, mappings] of Object.entries(collections)) {
      promises.push(this.sdk.collection.update(index, collection, { mappings }));
    }

    await Promise.all(promises);

    return { index, collections };
  }

  async delete (request: KuzzleRequest) {
    const index = this.getIndex(request);

    const { result: tenantExists } = await this.sdk.query({
      controller: 'device-manager/engine',
      action: 'exists',
      index,
    });

    if (! tenantExists) {
      throw new BadRequestError(`Tenant "${index}" does not have a device-manager engine`);
    }

    const collections = Object.keys(this.config.collections);

    const promises = [];

    for (const collection of collections) {
      promises.push(this.sdk.collection.delete(index, collection));
    }

    await Promise.all(promises);

    await this.sdk.document.delete(
      this.config.adminIndex,
      'engines',
      index,
      { refresh: 'wait_for' });

    return { index, collections };
  }

  async list () {
    const result = await this.sdk.document.search(
      this.config.adminIndex,
      'engines',
      {},
      { size: 1000 });

    return {
      engines: result.hits.map(hit => hit._source as any)
    };
  }

  async exists (request: KuzzleRequest) {
    const index = this.getIndex(request);

    return this.sdk.document.exists(this.config.adminIndex, 'engines', index);
  }
}
