import { Plugin } from 'kuzzle';
import { AbstractEngine } from 'kuzzle-plugin-commons';

import { catalogMappings } from '../models';

export class DeviceManagerEngine extends AbstractEngine {

  constructor (plugin: Plugin) {
    super('device-manager', plugin);
  }

  async init () {}

  async onCreate (index: string, group = 'commons') {
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
    promises.push(this.sdk.collection.create(index, 'config', {
      mappings: {
        dynamic: 'strict',
        properties: {
          type: { type: 'keyword' },

          catalog: catalogMappings,
        }
      } as any
    }));

    await Promise.all(promises);

    return { collections };
  }

  async onUpdate (index: string, group = 'commons') {
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

  async onDelete (index: string) {
    const promises = [];
    const templates = Object.keys(this.config.mappings.get('commons'));
    const collections = [];

    for (const collection of templates) {
      promises.push(this.sdk.collection.delete(index, collection)
        .then(() => { collections.push(collection); })
      );
    }

    await Promise.all(promises);

    return { collections };
  }
}
