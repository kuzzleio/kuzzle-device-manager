import {
    PluginContext,
    EmbeddedSDK,
    JSONObject,
    DocumentNotification,
    BadRequestError,
  } from 'kuzzle';

export class EngineService {
  private context: PluginContext;
  private config: JSONObject;

  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  init (config: JSONObject, context: PluginContext) {
    this.context = context;
    this.config = config;
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
}

export type Engine = {
  index: string;
}
