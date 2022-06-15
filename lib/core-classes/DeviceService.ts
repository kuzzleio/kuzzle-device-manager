import {
  BadRequestError,
  BatchController,
  JSONObject,
  KDocument,
  Plugin,
  PluginContext,
} from 'kuzzle';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { InternalCollection } from '../InternalCollection';
import { BaseAsset, Device } from '../models';
import { AttachRequest, LinkRequest } from '../types/Request';
import {
  DeviceContent,
  DeviceManagerConfiguration,
  MeasureContent,
} from '../types';
import {
  mRequest,
  mResponse,
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
    } = {},
  ): Promise<Device> {
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

    return device;
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

    device.linkToAsset({ assetId, deviceLink });
    asset.linkToDevice({ assetId, deviceLink });

    const response = await this.app.trigger(
      `${eventId}:before`, { asset, device });

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        device._id,
        response.device._source,
        { refresh }),

      this.sdk.document.update(
        engineId,
        InternalCollection.DEVICES,
        device._id,
        response.device._source,
        { refresh }),

      this.sdk.document.update(
        engineId,
        InternalCollection.ASSETS,
        asset._id,
        response.asset,
        { refresh }),
    ]);

    await this.app.trigger(
      `${eventId}:after`,
      response,
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

    asset.unlinkDevice(device);

    const response = await this.app.trigger(
      `${eventId}:before`,
      { asset, device },
    );

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        device._id,
        response.device,
        { refresh }),

      this.sdk.document.update(
        engineId,
        InternalCollection.DEVICES,
        device._id,
        response.device,
        { refresh }),

      this.sdk.document.update(
        engineId,
        InternalCollection.ASSETS,
        asset._id,
        { 
          deviceLinks: response.asset._source.deviceLinks,
          measures: response.asset._source.measures 
        },
        { refresh }),
    ]);

    await this.app.trigger(
      `${eventId}:after`,
      response,
    );

    return { asset, device };
  }

  // /**
  //  * Updates a device with the new measures
  //  *
  //  * @returns Updated device
  //  */
  // async TODO-replace-by-model-updateMeasures (
  //   device: Device,
  //   measures: MeasureContent[],
  // ) {
  //   // TODO : How to design the event calls ? Normally should not
  //   // TODO : Remove everything of it and call the refacto from
  //   const eventId = `${DeviceService.eventId}:measures`;

  //   device.updateMeasures(measures);

  //   const response = await this.app.trigger(
  //     // `engine:${device._source.engineId}:device:measures:new`,
  //     `${eventId}:new`,
  //     { device, measures });

  //   const deviceDocument = await this.batch.update<DeviceContent>(
  //     this.config.adminIndex,
  //     'devices',
  //     response.device._id,
  //     response.device._source,
  //     { retryOnConflict: 10, source: true });

  //   const engineId = device._source.engineId;
  //   if (engineId) {
  //     await this.batch.update<DeviceContent>(
  //       engineId,
  //       'devices',
  //       response.device._id,
  //       response.device._source,
  //       { retryOnConflict: 10 });
  //   }

  //   return new Device(deviceDocument._source);
  // }

  // TODO : See if changements needed
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

  // /**
  //  * Register a new device by creating the document in admin index
  //  * @todo add before/afterRegister events
  //  */
  // private async register (deviceId: string, deviceContent: DeviceContent, { refresh }) {
  //   // TODO : See if needed
  //   const deviceDoc = await this.batch.create<DeviceContent>(
  //     this.config.adminIndex,
  //     'devices',
  //     deviceContent,
  //     deviceId,
  //     { refresh });

  //   const device = new Device(deviceDoc._source);

  //   return {
  //     asset: null,
  //     device: device.serialize(),
  //     engineId: device._source.engineId,
  //   };
  // }

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
