import { KDocument } from 'kuzzle-sdk';
import {
  JSONObject,
  PluginContext,
  BadRequestError,
  Plugin,
} from 'kuzzle';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

import { BaseAsset, Device } from '../models';
import { BaseAssetContent, MeasureContent, DeviceContent, DeviceManagerConfiguration } from '../types';
import { mRequest, mResponse, writeToDatabase } from '../utils/';

export type DeviceBulkContent = {
  engineId?: string;
  deviceId: string;
  assetId?: string;
}

/**
 * Represents a request to link a device to an asset
 *
 * @example
 * {
 *   deviceId: 'Abeeway-4263232',
 *   assetId: 'container-xlarger-HSZJSZ',
 *   measuresNames: {
 *     temperature: 'External temperature',
 *     position: 'Lora Position'
 *   }
 * }
 */
export type LinkRequest = {
  assetId: string;

  deviceId: string;

  /**
   * List of measures names when linked to the asset.
   * Default measure name is measure type.
   */
  measuresNames?: {
    [measureType: string]: string;
  }
}

export type AttachRequest = {
  deviceId: string;

  engineId: string;
}

export class DeviceService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;

  private get sdk () {
    return this.context.accessors.sdk;
  }

  constructor (plugin: Plugin) {
    this.config = plugin.config as any;
    this.context = plugin.context;
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
    engineId: string,
    deviceContent: DeviceContent,
    assetId: string,
    { refresh }: { refresh?: any },
  ): Promise<KDocument<DeviceContent>> {
    const deviceId = Device.id(deviceContent.model, deviceContent.reference);

    const device = await this.sdk.document.create<DeviceContent>(
      this.config.adminIndex,
      'devices',
      deviceContent,
      deviceId,
      { refresh });

    if (this.config.adminIndex === engineId) {
      return device;
    }

    const attachedDevice = await this.attachEngine(
      { deviceId, engineId },
      { refresh, strict: true });

    if (! assetId) {
      return attachedDevice;
    }

    const { device: linkedDevice } = await this.linkAsset({ assetId, deviceId }, { refresh });

    return linkedDevice;
  }

  async attachEngine (
    attachRequest: AttachRequest,
    { refresh, strict }: { refresh?: any, strict?: boolean },
  ): Promise<Device> {
    const device = await this.getDevice(attachRequest.deviceId);

    if (strict && device._source.engineId) {
      throw new BadRequestError(`Device "${device._id}" is already attached to an engine.`);
    }

    if (! await this.tenantExists(attachRequest.engineId)) {
      throw new BadRequestError(`Engine "${attachRequest.engineId}" does not exists.`);
    }

    device._source.engineId = attachRequest.engineId;


    const response = await global.app.trigger(
      'device-manager:device:attach-engine:before',
      {
        device,
        engineId: attachRequest.engineId,
      });
    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        'devices',
        response.device._id,
        { engineId: response.device._source.engineId },
        { refresh }),

      this.sdk.document.createOrReplace(
        response.device._source.engineId,
        'devices',
        response.device._id,
        response.device._source,
        { refresh }),
    ]);

    await global.app.trigger('device-manager:device:attach-engine:after', {
      device,
      engineId: attachRequest.engineId,
    });

    return device;
  }

  async detachEngine (
    deviceId: string,
    { refresh, strict }: { refresh?: any, strict?: boolean }
  ): Promise<Device> {
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
        { refresh }),

      this.sdk.document.delete(
        response.engineId,
        'devices',
        device._id,
        { refresh }),
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
   * Each measures will be given a distinct name when copied into the asset
   */
  async linkAsset (
    linkRequest: LinkRequest,
    { refresh }: { refresh?: any }
  ): Promise<{ asset: BaseAsset, device: Device }> {
    const device = await this.getDevice(linkRequest.deviceId);

    const engineId = device._source.engineId;

    if (! engineId) {
      throw new BadRequestError(`Device "${device._id}" is not attached to an engine.`);
    }

    if (device._source.assetId) {
      throw new BadRequestError(`Device "${device._id}" is already linked to an asset.`);
    }

    const asset = await this.getAsset(linkRequest.assetId, engineId);

    if (! _.isArray(asset._source.measures)) {
      throw new BadRequestError(`Asset "${linkRequest.assetId}" measures property is not an array.`);
    }

    // Copy device measures and assign measures names
    const measures: MeasureContent[] = (device._source.measures || []).map(measure => {
      const name = _.get(linkRequest, `measuresNames.${measure.type}`, measure.type);

      return { ...measure, name };
    });

  
    const listMeasures = []; // contain name and type of each measure to keep this data in device element
    for(const measure of measures) {
      listMeasures.push({name : measure.name, type : measure.type});
    }
  
    const newMeasuresNames = measures.map(m => m.name);
        
    const duplicateMeasure = asset._source.measures.find(m => newMeasuresNames.includes(m.name));
    if (duplicateMeasure) {
      throw new BadRequestError(`Duplicate measure name "${duplicateMeasure.name}"`);
    }

    // Keep previous asset measures of different types
    for (const previousMeasure of asset._source.measures) {
      if (! measures.find(m => m.name === previousMeasure.name)) {
        measures.push(previousMeasure);
      }
    }

    asset._source.measures = measures;
    device._source.assetId = linkRequest.assetId;

    if(!asset._source.deviceLinks) {
      asset._source.deviceLinks=[];
    }
    asset._source.deviceLinks.push({deviceId : linkRequest.deviceId}); //TODO : gérer les measuresName
    
    const response = await global.app.trigger(
      'device-manager:device:link-asset:before',
      { asset, device },
    );

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        'devices',
        device._id,
        { assetId: response.device._source.assetId,
          measuresName : listMeasures
        },
        { refresh }),
      this.sdk.document.update(
        engineId,
        'devices',
        device._id,
        { assetId: response.device._source.assetId,
          measuresName : listMeasures },
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
      'device-manager:device:link-asset:after',
      { asset, device },
    );

    return { asset, device };
  }

  async unlinkAsset (
    deviceId: string,
    { refresh, strict }: { refresh?: any, strict?: boolean }
  ): Promise<{ asset: BaseAsset, device: Device }> {
    const device = await this.getDevice(deviceId);

    const engineId = device._source.engineId;

    if (strict && ! engineId) {
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

    if(Array.isArray(asset._source.deviceLinks)) {
      const filteredDeviceList = [];
      for(const linkedDevice of asset._source.deviceLinks) {
        if(linkedDevice.deviceId !== deviceId) {
          filteredDeviceList.push(linkedDevice);
        }
      }
      asset._source.deviceLinks = filteredDeviceList;
    } 


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
    { refresh, strict }: { refresh?: any, strict?: boolean }): Promise<mResponse> {
    const results = {
      errors: [],
      successes: [],
    };

    const withoutIds = catalog.filter(content => ! content.deviceId);

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
          { refresh, strict });

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
