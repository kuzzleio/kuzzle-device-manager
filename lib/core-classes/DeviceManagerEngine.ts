import { Plugin } from 'kuzzle';
import { AbstractEngine } from 'kuzzle-plugin-commons';

import { DeviceManagerConfig, DeviceManagerPlugin } from '../DeviceManagerPlugin';
import { catalogMappings } from '../models';
import { AssetMappingsManager } from './CustomMappings/AssetMappingsManager';
import { DeviceMappingsManager } from './CustomMappings/DeviceMappingsManager';

export class DeviceManagerEngine extends AbstractEngine<DeviceManagerPlugin> {
  public config: DeviceManagerConfig;

  private assetMappings: AssetMappingsManager;
  private deviceMappings: DeviceMappingsManager;

  constructor (plugin: Plugin, assetMappings: AssetMappingsManager, deviceMappings: DeviceMappingsManager) {
    super(
      'device-manager',
      plugin,
      plugin.config.adminIndex,
      plugin.config.configCollection);

    this.assetMappings = assetMappings;
    this.deviceMappings = deviceMappings;
  }

  async onCreate (index: string, group = 'commons') {
    const promises = [];

    promises.push(this.sdk.collection.create(index, 'assets', {
      mappings: this.assetMappings.get(group)
    }));

    promises.push(this.sdk.collection.create(index, 'asset-history', {
      mappings: this.getAssetsHistoryMappings(group)
    }));

    promises.push(this.sdk.collection.create(index, 'devices', {
      mappings: this.deviceMappings.get()
    }));

    promises.push(this.sdk.collection.create(index, this.config.configCollection, {
      mappings: {
        dynamic: 'strict',
        properties: {
          type: { type: 'keyword' },

          catalog: catalogMappings,
        }
      } as any
    }));

    await Promise.all(promises);

    return { collections: ['assets', 'asset-history', this.config.configCollection, 'devices'] };
  }

  async onUpdate (index: string, group = 'commons') {
    const promises = [];

    promises.push(this.sdk.collection.create(index, 'assets', {
      mappings: this.assetMappings.get(group)
    }));

    promises.push(this.sdk.collection.create(index, 'asset-history', {
      mappings: this.getAssetsHistoryMappings(group)
    }));

    promises.push(this.sdk.collection.create(index, 'devices', {
      mappings: this.deviceMappings.get()
    }));

    await Promise.all(promises);

    return { collections: ['assets', 'asset-history', 'devices'] };
  }

  async onDelete (index: string) {
    const promises = [];

    promises.push(this.sdk.collection.delete(index, 'assets'));
    promises.push(this.sdk.collection.delete(index, 'asset-history'));
    promises.push(this.sdk.collection.delete(index, 'devices'));

    await Promise.all(promises);

    return { collections: ['assets', 'asset-history', 'devices'] };
  }

  private getAssetsHistoryMappings (group: string) {
    const mappings = JSON.parse(JSON.stringify(this.config.collections['asset-history']));

    mappings.properties.asset = this.assetMappings.get(group);

    return mappings;
  }
}
