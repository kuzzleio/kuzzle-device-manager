import { Plugin } from 'kuzzle';
import { AbstractEngine } from 'kuzzle-plugin-commons';

import { DeviceManagerConfig, DeviceManagerPlugin } from '../DeviceManagerPlugin';
import { catalogMappings } from '../models';
import { AssetsRegister } from './registers/AssetsRegister';
import { DevicesRegister } from './registers/DevicesRegister';
import { MeasuresRegister } from './registers/MeasuresRegister';

export class DeviceManagerEngine extends AbstractEngine<DeviceManagerPlugin> {
  public config: DeviceManagerConfig;

  private assetsRegister: AssetsRegister;
  private devicesRegister: DevicesRegister;
  private measuresRegister: MeasuresRegister;

  constructor (
    plugin: Plugin,
    assetsRegister: AssetsRegister,
    devicesRegister: DevicesRegister,
    measuresRegister: MeasuresRegister,
  ) {
    super(
      'device-manager',
      plugin,
      plugin.config.adminIndex,
      plugin.config.configCollection);

    this.context = plugin.context;
    this.assetsRegister = assetsRegister;
    this.devicesRegister = devicesRegister;
    this.measuresRegister = measuresRegister;
  }

  async onCreate (index: string, group = 'commons') {
    const promises = [];

    promises.push(this.sdk.collection.create(index, 'assets', {
      mappings: this.assetsRegister.getMappings(group)
    }));

    promises.push(this.sdk.collection.create(index, 'devices', {
      mappings: this.devicesRegister.getMappings()
    }));

    promises.push(this.sdk.collection.create(index, 'measures', {
      mappings: this.measuresRegister.getMappings()
    }));

    promises.push(this.sdk.collection.create(index, this.config.configCollection, {
      mappings: {
        dynamic: 'strict',
        properties: {
          catalog: catalogMappings,

          type: { type: 'keyword' },
        }
      } as any
    }));

    await Promise.all(promises);

    return { collections: ['assets', this.config.configCollection, 'devices', 'measures'] };
  }

  async onUpdate (index: string, group = 'commons') {
    const promises = [];

    promises.push(this.sdk.collection.create(index, 'assets', {
      mappings: this.assetsRegister.getMappings(group)
    }));

    promises.push(this.sdk.collection.create(index, 'devices', {
      mappings: this.devicesRegister.getMappings()
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
