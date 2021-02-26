import {
    PluginContext,
    EmbeddedSDK,
    JSONObject,
    BadRequestError,
  } from 'kuzzle';

export class EngineService {
  private context: PluginContext;
  private config: JSONObject;

  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor (config: JSONObject, context: PluginContext) {
    this.config = config;
    this.context = context;
  }

  private async hasEngine (index: string) {
    const { result: tenantExists } = await this.sdk.query({
      controller: 'device-manager/engine',
      action: 'exists',
      index,
    });

    if (! tenantExists) {
      throw new BadRequestError(`Tenant "${index}" does not have a device-manager engine`);
    }
  }

  async create (index: string) {
    const promises = [];
    const collections = this.config.collections;

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
  }

  async update (index: string) {
    const promises = [];
    const collections = this.config.collections;

    await this.hasEngine(index);

    for (const [collection, mappings] of Object.entries(collections)) {
      promises.push(this.sdk.collection.update(index, collection, { mappings }));
    }

    await Promise.all(promises);
  }

  async delete (index: string) {
    const promises = [];
    const collections = Object.keys(this.config.collections);

    await this.hasEngine(index);

    for (const collection of collections) {
      promises.push(this.sdk.collection.delete(index, collection));
    }

    await Promise.all(promises);

    await this.sdk.document.delete(
      this.config.adminIndex,
      'engines',
      index,
      { refresh: 'wait_for' });
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
}

export type Engine = {
  index: string;
}
