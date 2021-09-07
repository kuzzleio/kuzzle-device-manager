import { Plugin } from 'kuzzle';
import { AbstractEngine } from 'kuzzle-plugin-commons';

import { catalogMappings } from '../models';
import { AssetMappingsManager } from './AssetMappingsManager';
import { DeviceMappingsManager } from './DeviceMappingsManager';

export class DeviceManagerEngine extends AbstractEngine {
  private assetMappings: AssetMappingsManager;
  private deviceMappings: DeviceMappingsManager;

  constructor (plugin: Plugin, assetMappings: AssetMappingsManager, deviceMappings: DeviceMappingsManager) {
    super('device-manager', plugin);

    this.assetMappings = assetMappings;
    this.deviceMappings = deviceMappings;
  }

  async onCreate (index: string, group = 'commons') {
    const promises = [];

    promises.push(this.sdk.collection.create(index, 'assets', {
      mappings: this.assetMappings.get(group)
    }));

    promises.push(this.sdk.collection.create(index, 'devices', {
      mappings: this.deviceMappings.get()
    }));

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

    return { collections: ['assets', 'config', 'devices'] };
  }

  async onUpdate (index: string, group = 'commons') {
    const promises = [];

    promises.push(this.sdk.collection.create(index, 'assets', {
      mappings: this.assetMappings.get(group)
    }));

    promises.push(this.sdk.collection.create(index, 'devices', {
      mappings: this.deviceMappings.get()
    }));

    await Promise.all(promises);

    return { collections: ['assets', 'devices'] };
  }

  async onDelete (index: string) {
    const promises = [];

    promises.push(this.sdk.collection.delete(index, 'assets'));
    promises.push(this.sdk.collection.delete(index, 'devices'));

    await Promise.all(promises);

    return { collections: ['assets', 'devices'] };
  }
}
