import { Plugin } from 'kuzzle';
import { AbstractEngine } from 'kuzzle-plugin-commons';

import { DeviceManagerConfig, DeviceManagerPlugin } from '../DeviceManagerPlugin';
import { catalogMappings } from '../models';
import { AssetMappingsManager } from './CustomMappings/AssetMappingsManager';
import { DeviceMappingsManager } from './CustomMappings/DeviceMappingsManager';
import { MeasuresRegister } from './MeasuresRegister';

export class DeviceManagerEngine extends AbstractEngine<DeviceManagerPlugin> {
  public config: DeviceManagerConfig;

  private assetMappings: AssetMappingsManager;
  private deviceMappings: DeviceMappingsManager;
  private measuresRegister: MeasuresRegister;

  constructor (
    plugin: Plugin,
    assetMappings: AssetMappingsManager,
    deviceMappings: DeviceMappingsManager,
    measuresRegister: MeasuresRegister,
  ) {
    super(
      'device-manager',
      plugin,
      plugin.config.adminIndex,
      plugin.config.configCollection);

    this.context = plugin.context;
    this.assetMappings = assetMappings;
    this.deviceMappings = deviceMappings;
    this.measuresRegister = measuresRegister;
  }

  async onCreate (index: string, group = 'commons') {
    const promises = [];

    promises.push(this.sdk.collection.create(index, 'assets', {
      mappings: this.assetMappings.get(group)
    }));

    promises.push(this.sdk.collection.create(index, 'devices', {
      mappings: this.deviceMappings.get()
    }));

    promises.push(this.sdk.collection.create(index, 'measures', {
      mappings: this.measuresRegister.getMappings()
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

    return { collections: ['assets', this.config.configCollection, 'devices', 'measures'] };
  }

  async onUpdate (index: string, group = 'commons') {
    const promises = [];

    promises.push(this.sdk.collection.create(index, 'assets', {
      mappings: this.assetMappings.get(group)
    }));

    promises.push(this.sdk.collection.create(index, 'devices', {
      mappings: this.deviceMappings.get()
    }));

    promises.push(this.sdk.collection.create(index, 'measures', {
      mappings: this.measuresRegister.getMappings()
    }));

    await Promise.all(promises);

    return { collections: ['assets', 'devices', 'measures'] };
  }

  async onDelete (index: string) {
    const promises = [];

    promises.push(this.sdk.collection.delete(index, 'assets'));
    promises.push(this.sdk.collection.delete(index, 'devices'));
    promises.push(this.sdk.collection.delete(index, 'measures'));

    await Promise.all(promises);

    return { collections: ['assets', 'devices', 'measures'] };
  }
}
