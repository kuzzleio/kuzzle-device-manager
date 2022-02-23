import {
  JSONObject,
  PluginContext,
  BadRequestError,
  Plugin,
} from 'kuzzle';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

import { BaseAsset, Device } from '../models';
import { BaseAssetContent, DeviceContent, DeviceManagerConfiguration } from '../types';
import { mRequest, mResponse, writeToDatabase } from '../utils/';

export type DeviceBulkContent = {
  engineId?: string;
  deviceId: string;
  assetId?: string;
}
export class DeviceService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;

  private get sdk () {
    return this.context.accessors.sdk;
  }

  constructor(plugin: Plugin) {
    this.config = plugin.config as any;
    this.context = plugin.context;

  }

  async attachEngine (
    engineId: string,
    deviceId: string,
    { strict, options }: { strict?: boolean, options?: JSONObject },
  ) {
    const device = await this.getDevice(deviceId);

    if (strict && device._source.engineId) {
      throw new BadRequestError(`Device "${device._id}" is already attached to an engine.`);
    }

    if (! await this.tenantExists(engineId)) {
      throw new BadRequestError(`Engine "${engineId}" does not exists.`);
    }

    device._source.engineId = engineId;

    const response = await global.app.trigger(
      'device-manager:device:attach-engine:before',
      {
        device,
        engineId,
      });

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        'devices',
        response.device._id,
        { engineId: response.device._source.engineId },
        options),

      this.sdk.document.createOrReplace(
        response.device._source.engineId,
        'devices',
        response.device._id,
        response.device._source,
        options),
    ]);

    await global.app.trigger('device-manager:device:attach-engine:after', {
      device,
      engineId,
    });

    return device;
  }

  async detachEngine (deviceId: string, { strict, options }: { strict?: boolean, options?: JSONObject }) {
    const device = await this.getDevice(deviceId);

    const engineId = device._source.engineId;

    if (strict && ! engineId) {
      throw new BadRequestError(`Device "${device._id}" is not attached to an engine.`);
    }

    if (device._source.assetId) {
      throw new BadRequestError(`Device "${device._id}" is still linked to an asset.`);
    }

    const response = await global.app.trigger(
      'device-manager:device:detach-engine:before',
      {
        device,
        engineId,
      });

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        'devices',
        device._id,
        { engineId: null },
        options),

      this.sdk.document.delete(
        response.engineId,
        'devices',
        device._id,
        options),
    ]);

    await global.app.trigger('device-manager:device:detach-engine:after', {
      device,
      engineId,
    });

    return device;
  }

  /**
   * Link a device to an asset and copy device measures into the asset.
   *
   * @todo measures names should be provided
   */
  async linkAsset (deviceId: string, assetId: string, { strict, options }: { strict?: boolean, options?: JSONObject }) {
    const device = await this.getDevice(deviceId);

    const engineId = device._source.engineId;

    if (! engineId) {
      throw new BadRequestError(`Device "${device._id}" is not attached to an engine.`);
    }

    if (device._source.assetId) {
      throw new BadRequestError(`Device "${device._id}" is already linked to an asset.`);
    }

    const asset = await this.getAsset(assetId, engineId);

    if (! _.isArray(asset._source.measures)) {
      throw new BadRequestError(`Asset "${assetId}" measures property is not an array.`);
    }

    // Copy device measures
    const measures = device._source.measures.map(m => m);

    // Keep previous asset measures of different types
    // @todo this should be done by measure name and not type
    for (const previousMeasure of asset._source.measures) {
      if (! measures.find(m => m.type === previousMeasure.type)) {
        measures.push(previousMeasure);
      }
    }

    asset._source.measures = measures;
    device._source.assetId = assetId;

    const response = await global.app.trigger(
      'device-manager:device:link-asset:before',
      { asset, device },
    );

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        'devices',
        device._id,
        { assetId: response.device._source.assetId },
        options),

      this.sdk.document.update(
        engineId,
        'devices',
        device._id,
        { assetId: response.device._source.assetId },
        options),

      this.sdk.document.update(
        engineId,
        'assets',
        asset._id,
        { measures: response.asset._source.measures },
        options),
    ]);

    await global.app.trigger(
      'device-manager:device:link-asset:before',
      { asset, device },
    );

    return { asset, device };
  }

  async unlinkAsset (deviceId: string, { strict, options }: { strict?: boolean, options?: JSONObject }) {
    const device = await this.getDevice(deviceId);

    const engineId = device._source.engineId;

    if (! engineId) {
      throw new BadRequestError(`Device "${device._id}" is not attached to an engine.`);
    }

    if (! device._source.assetId) {
      throw new BadRequestError(`Device "${device._id}" is not linked to an asset.`);
    }

    const asset = await this.getAsset(device._source.assetId, engineId);

    // @todo should be done by measure name and not type
    asset._source.measures = asset._source.measures.filter(m => {
      return ! device._source.measures.find(dm => dm.type === m.type);
    });
    device._source.assetId = null;

    const response = await global.app.trigger(
      'device-manager:device:unlink-asset:before',
      { asset, device },
    );

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        'devices',
        device._id,
        { assetId: null },
        options),

      this.sdk.document.update(
        engineId,
        'devices',
        device._id,
        { assetId: null },
        options),

      this.sdk.document.update(
        engineId,
        'assets',
        asset._id,
        { measures: response.asset._source.measures },
        options),
    ]);

    await global.app.trigger(
      'device-manager:device:unlink-asset:before',
      { asset, device },
    );

    return { asset, device };
  }

  async importDevices(
    devices: JSONObject,
    { strict, options }: { strict?: boolean, options?: JSONObject }) {
    const results = {
      errors: [],
      successes: [],
    };

    const deviceDocuments = devices
      .map((device: JSONObject) => ({ _id: device._id || uuidv4(), body: _.omit(device, ['_id']) }));

    await writeToDatabase(
      deviceDocuments,
      async (result: mRequest[]): Promise<mResponse> => {

        const created = await this.sdk.document.mCreate(
          'device-manager',
          'devices',
          result,
          { strict, ...options });

        return {
          errors: results.errors.concat(created.errors),
          successes: results.successes.concat(created.successes)
        };
      });

    return results;
  }

  async importCatalog (
    catalog: JSONObject[],
    { strict, options }: { strict?: boolean, options?: JSONObject }): Promise<mResponse> {
    const results = {
      errors: [],
      successes: [],
    };

    const withoutIds = catalog.filter(content => !content.deviceId);

    if (withoutIds.length > 0) {
      throw new BadRequestError(`${withoutIds.length} Devices do not have an ID`);
    }

    const catalogDocuments = catalog
      .map((catalogContent: JSONObject) => ({
        _id: `catalog--${catalogContent.deviceId}`,
        body: {
          catalog: {
            authorized: catalogContent.authorized === 'false' ? false : true,
            deviceId: catalogContent.deviceId,
          },
          type: 'catalog'
        }
      }));

    await writeToDatabase(
      catalogDocuments,
      async (result: mRequest[]): Promise<mResponse> => {
        const created = await this.sdk.document.mCreate(
          this.config.adminIndex,
          this.config.adminCollections.config.name,
          result,
          { strict, ...options });

        return {
          errors: results.errors.concat(created.errors),
          successes: results.successes.concat(created.successes)
        };
      });

    return results;
  }

  private async getAsset (assetId: string, engineId: string) {
    const document = await this.sdk.document.get(engineId, 'assets', assetId);

    return new BaseAsset(document._source as BaseAssetContent, document._id);
  }

  private async getDevice (deviceId: string) {
    const document = await this.sdk.document.get(this.config.adminIndex, 'devices', deviceId);

    return new Device(document._source as DeviceContent, document._id);
  }

  private async tenantExists (engineId: string) {
    const { result: tenantExists } = await this.sdk.query({
      action: 'exists',
      controller: 'device-manager/engine',
      index: engineId,
    });

    return tenantExists;
  }
}
