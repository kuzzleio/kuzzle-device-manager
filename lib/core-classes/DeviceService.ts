import {
  BadRequestError,
  BatchController,
  JSONObject,
  KDocument,
  Plugin,
  PluginContext,
} from 'kuzzle';
import { LinkRequest } from 'lib/types/Request';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { InternalCollection } from '../InternalCollection';
import { BaseAsset, Device } from '../models';
import { LinkRequest } from '../types/Request';
import {
  DeviceContent,
  DeviceManagerConfiguration,
  MeasureContent,
} from '../types';
import {
  mRequest,
  mResponse,
  refreshCollections,
  writeToDatabase,
} from '../utils/';
import { AssetService } from './AssetService';

export type DeviceBulkContent = {
  engineId?: string;
  deviceId: string;
  assetId?: string;
}

export class DeviceService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private batch: BatchController;
  private assetService: AssetService;
  static eventId = 'device-manager:device';

  private get sdk () {
    return this.context.accessors.sdk;
  }

  private get app (): Backend {
    return global.app;
  }

  constructor (
    plugin: Plugin,
    batchController: BatchController,
    assetService: AssetService
  ) {
    this.config = plugin.config as any;
    this.context = plugin.context;
    this.assetService = assetService;

    this.batch = batchController;
  }

  /**
   * Create a new device.
   *
   * If the engineId is not the administration one, then the device will be
   * automatically attached to the one provided.
   *
   * If an assetId is provided, then the device will be linked to this asset.
   *
   * @param engineId If it's not the admin engine, then the device will be attached to this one
   * @param deviceContent Content of the device to create
   */
  async create (
    deviceContent: DeviceContent,
    { engineId, measures, linkRequest, refresh, strict }: {
      engineId?: string,
      measures?: MeasureContent[],
      linkRequest?: LinkRequest,
      refresh?: any,
      strict?: boolean
    },
  ): Promise<KDocument<DeviceContent>> {
    const collectionsToRefresh: [string, string][] = [];
    const device = new Device(
      deviceContent, Device.id(deviceContent.model, deviceContent.reference));

    if (measures) {
      device.updateMeasures(measures);
    }

    let asset: BaseAsset;
    if (linkRequest) {
      try {
        asset = await this.assetService.getAsset(engineId, linkRequest.assetId);
        device.linkToAsset(linkRequest);
        asset.linkToDevice(linkRequest);
      }
      catch (error) {
        if (strict) {
          throw error;
        }
      }
    }

    if (this.config.adminIndex !== engineId) {
      if (! await this.tenantExists(engineId)) {
        if (strict) {
          throw new BadRequestError(`Engine "${engineId}" does not exists.`);
        }
      }
      else {
        device._source.engineId = engineId;

        await this.sdk.document.create(
          engineId,
          InternalCollection.DEVICES,
          device._source,
          device._id,
          { refresh });
      }
    }

    await this.sdk.document.create(
      this.config.adminIndex,
      InternalCollection.DEVICES,
      device._source,
      device._id,
      { refresh });

    if (asset) {
      await this.sdk.document.update(
        engineId,
        InternalCollection.ASSETS,
        asset._id,
        asset._source,
        { refresh });
    }

    return { device };
  }

  async attachEngine (
    { deviceId, engineId }: AttachRequest,
    { refresh, strict }: { refresh?: any, strict?: boolean },
  ): Promise<Device> {
    const eventId = `${DeviceService.eventId}:attach-engine`;
    const device = await this.getDevice(this.config, deviceId);

    if (! device) {
      throw new BadRequestError(`Device "${device._id}" does not exist.`);
    }

    if (strict && device._source.engineId) {
      throw new BadRequestError(`Device "${device._id}" is already attached to an engine.`);
    }

    if (! await this.tenantExists(engineId)) {
      throw new BadRequestError(`Engine "${engineId}" does not exists.`);
    }

    device._source.engineId = engineId;

    const response = await this.app.trigger(`${eventId}:before`, { device });

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        response.device._id,
        { engineId: response.device._source.engineId },
        { refresh }),

      this.sdk.document.createOrReplace(
        response.device._source.engineId,
        InternalCollection.DEVICES,
        response.device._id,
        response.device._source,
        { refresh }),
    ]);

    await this.app.trigger(`${eventId}:after`,  response );

    return device;
  }

  async detachEngine (
    deviceId: string,
    { refresh, strict }: { refresh?: any, strict?: boolean }
  ): Promise<Device> {
    const eventId = `${DeviceService.eventId}:detach-engine`;
    const device = await this.getDevice(this.config, deviceId);

    const engineId = device._source.engineId;

    if (! device) {
      throw new BadRequestError(`Device "${device._id}" does not exist.`);
    }

    if (strict && ! engineId) {
      throw new BadRequestError(`Device "${device._id}" is not attached to an engine.`);
    }

    if (device._source.assetId) {
      throw new BadRequestError(`Device "${device._id}" is still linked to an asset.`);
    }

    const response = await this.app.trigger(
      `${eventId}:before`, { device, engineId });

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        response.device._id,
        { engineId: null },
        { refresh }),

      this.sdk.document.delete(
        engineId,
        InternalCollection.DEVICES,
        response.device._id,
        { refresh }),
    ]);

    await this.app.trigger(`${eventId}:after`, response);

    return device;
  }

  /**
   * Link a device to an asset and copy device measures into the asset.
   *
   * Each measures will be given a distinct name when copied into the asset
   */
  async linkAsset (
    { assetId, deviceLink }: LinkRequest,
    { refresh }: { refresh?: any }
  ): Promise<{ asset: BaseAsset, device: Device }> {
    const eventId = `${DeviceService.eventId}:link-asset`;
    const device = await this.getDevice(this.config, deviceLink.deviceId);

    const engineId = device._source.engineId;

    if (! engineId) {
      throw new BadRequestError(`Device "${device._id}" is not attached to an engine.`);
    }

    if (device._source.assetId) {
      throw new BadRequestError(`Device "${device._id}" is already linked to an asset.`);
    }

    const asset = await this.assetService.getAsset(engineId, assetId);

    if (! asset) {
      throw new BadRequestError(`Asset "${asset._id}" does not exist.`);
    }

    device.linkAsset
    asset._source.deviceLinks.push(deviceLink); 

    const response = await this.app.trigger(
      `${eventId}:before`, { asset, device });

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        device._id,
        {
          assetId: response.device._source.assetId
        },
        { refresh }),

      this.sdk.document.update(
        engineId,
        InternalCollection.DEVICES,
        device._id,
        {
          assetId: response.device._source.assetId,
          measuresName: listMeasures
        },
        { refresh }),

      this.sdk.document.update(
        engineId,
        InternalCollection.ASSETS,
        asset._id,
        { 
          deviceLinks: response.asset._source.deviceLinks,
        },
        { refresh }),
    ]);

    await this.app.trigger(
      'device-manager:device:link-asset:after',
      { asset, device },
    );

    return { asset, device };
  }

  /**
   * Unlink a device of an asset and copy device measures into the asset.
   */
  async unlinkAsset (
    deviceId: string,
    { refresh, strict }: { refresh?: any, strict?: boolean }
  ): Promise<{ asset: BaseAsset, device: Device }> {
    const eventId = `${DeviceService.eventId}:unlink-asset`;
    const device = await this.getDevice(this.config, deviceId);

    if (! device) {
      throw new BadRequestError(`Device "${device._id}" does not exist.`);
    }

    const engineId = device._source.engineId;

    if (strict && ! engineId) {
      throw new BadRequestError(`Device "${device._id}" is not attached to an engine.`);
    }

    if (! device._source.assetId) {
      throw new BadRequestError(`Device "${device._id}" is not linked to an asset.`);
    }

    const asset = await this.assetService.getAsset(engineId, device._source.assetId);

    // @todo should be done by measure name and not type
    asset._source.measures = asset._source.measures.filter(m => {
      return ! device._source.measures.find(dm => dm.type === m.type);
    });
    device._source.assetId = null;

    const filteredDeviceList = asset._source.deviceLinks.filter(linkedDevice => linkedDevice.deviceId !== deviceId);
    asset._source.deviceLinks = filteredDeviceList;

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
        { refresh }),

      this.sdk.document.update(
        engineId,
        'devices',
        device._id,
        { assetId: null },
        { refresh }),

      this.sdk.document.update(
        engineId,
        'assets',
        asset._id,
        { 
          deviceLinks: response.asset._source.deviceLinks,
          measures: response.asset._source.measures 
        },
        { refresh }),
    ]);

    await global.app.trigger(
      'device-manager:device:unlink-asset:before',
      { asset, device },
    );

    return { asset, device };
  }

  /**
   * Updates a device with the new measures
   *
   * @returns Updated device
   */
  async updateMeasures (
    device: Device,
    newMeasures: MeasureContent[],
  ) {
    // dup array reference
    const measures = newMeasures.map(m => m);

    // Keep previous measures that were not updated
    for (const previousMeasure of device._source.measures) {
      if (! measures.find(m => m.type === previousMeasure.type)) {
        measures.push(previousMeasure);
      }
    }

    device._source.measures = measures;

    const result = await global.app.trigger(
      `engine:${device._source.engineId}:device:measures:new`,
      { device, measures: newMeasures });

    const deviceDocument = await this.batch.update<DeviceContent>(
      this.config.adminIndex,
      'devices',
      result.device._id,
      result.device._source,
      { retryOnConflict: 10, source: true });

    const engineId = device._source.engineId;
    if (engineId) {
      await this.batch.update<DeviceContent>(
        engineId,
        'devices',
        result.device._id,
        result.device._source,
        { retryOnConflict: 10 });
    }

    return new Device(deviceDocument._source);
  }

  async importDevices (
    devices: JSONObject,
    { refresh, strict }: { refresh?: any, strict?: boolean }) {
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
          { refresh, strict });

        return {
          errors: results.errors.concat(created.errors),
          successes: results.successes.concat(created.successes)
        };
      });

    return results;
  }

  async importCatalog (
    catalog: JSONObject[],
    { refresh, strict }: { refresh?: any, strict?: boolean }
  ): Promise<mResponse> {
    const results = {
      errors: [],
      successes: [],
    };

    const withoutIds = catalog.filter(content => ! content.deviceId);

    if (withoutIds.length > 0) {
      throw new BadRequestError(`${withoutIds.length} Devices do not have an ID`);
    }

    const catalogDocuments = catalog.map(
      (catalogContent: JSONObject) => ({
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
          { refresh, strict });

        return {
          errors: results.errors.concat(created.errors),
          successes: results.successes.concat(created.successes)
        };
      });

    return results;
  }

  public async getDevice (
    config: DeviceManagerConfiguration,
    deviceId: string
  ): Promise<Device> {
    const document = await this.sdk.document.get(
      config.adminIndex,
      InternalCollection.DEVICES,
      deviceId);

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
