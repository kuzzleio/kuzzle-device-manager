import {
  PluginContext,
  EmbeddedSDK,
  JSONObject,
  BadRequestError,
  NotFoundError,
} from 'kuzzle';

function engineId (index) {
  return `engine--device-manager--${index}`;
}

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

  async create (index: string, group = 'commons') {
    if (await this.exists(index)) {
      throw new BadRequestError(`Tenant "${index}" already have a device-manager engine`);
    }

    const collections = [];
    const promises = [];
    const templates = this.config.mappings.get(group)
      ? this.config.mappings.get(group)
      : this.config.mappings.get('commons');

    for (const [collection, mappings] of Object.entries(templates)) {
      promises.push(
        this.sdk.collection.create(index, collection, { mappings })
          .then(() => { collections.push(collection); })
      );
    }

    await Promise.all(promises);

    await this.sdk.document.create(
      this.config.adminIndex,
      'config',
      { type: 'engine-device-manager', engine: { index } },
      engineId(index),
      { refresh: 'wait_for' })

    return { collections };
  }

  async update (index: string, group = 'commons') {
    if (! await this.exists(index)) {
      throw new NotFoundError(`Tenant "${index}" does not have a device-manager engine`);
    }

    const collections = [];
    const promises = [];
    const templates = this.config.mappings.get(group)
      ? this.config.mappings.get(group)
      : this.config.mappings.get('commons');

    for (const [collection, mappings] of Object.entries(templates)) {
      promises.push(this.sdk.collection.update(index, collection, { mappings })
        .then(() => { collections.push(collection); })
      );
    }

    await Promise.all(promises);

    return { collections };
  }

  async delete (index: string) {
    if (! await this.exists(index)) {
      throw new NotFoundError(`Tenant "${index}" does not have a device-manager engine`);
    }

    const promises = [];
    const templates = Object.keys(this.config.mappings.get('commons'));
    const collections = [];

    for (const collection of templates) {
      promises.push(this.sdk.collection.delete(index, collection)
        .then(() => { collections.push(collection); })
      );
    }

    await Promise.all(promises);

    await this.sdk.document.delete(
      this.config.adminIndex,
      'config',
      engineId(index),
      { refresh: 'wait_for' });

    return { collections };
  }

  async list () {
    const result = await this.sdk.document.search(
      this.config.adminIndex,
      'config',
      {
        equals: { type: 'engine-device-manager' },
      },
      { size: 1000, lang: 'koncorde' });

    return {
      engines: result.hits.map(hit => hit._source as any)
    };
  }

  async exists (index: string): Promise<boolean> {
    const tenantExists = await this.sdk.document.exists(
      this.config.adminIndex,
      'config',
      engineId(index));

    return tenantExists;
  }
}

export type Engine = {
  index: string;
}
