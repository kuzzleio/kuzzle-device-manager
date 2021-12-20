import {
  JSONObject,
  PluginContext,
  EmbeddedSDK,
  BadRequestError,
  NotFoundError,
  PreconditionError,
  Plugin,
  Document
} from 'kuzzle';

import { v4 as uuidv4 } from 'uuid';
import omit from 'lodash/omit';

import { Decoder } from './Decoder';
import { Device } from '../models';
import { DeviceManagerConfig } from '../DeviceManagerPlugin';
import { mRequest, mResponse, writeToDatabase } from '../utils/writeMany';

export type DeviceBulkContent = {
  tenantId?: string;
  deviceId: string;
  assetId?: string;
}

export type DeviceBulkBuildedContent = {
  tenantId: string;
  deviceIds: string[];
  assetIds: string[];
}

export type DeviceMAttachTenantContent = {
  errors: JSONObject[];
  successes: JSONObject[];
}

export class DeviceService {
  private config: DeviceManagerConfig;
  private context: PluginContext;

  private decoders: Map<string, Decoder>;

  get sdk(): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor(plugin: Plugin, decoders: Map<string, Decoder>) {
    this.config = plugin.config as any;
    this.context = plugin.context;

    this.decoders = decoders;
  }

  async mAttachTenants (
    devices: Device[],
    bulkData: DeviceBulkContent[],
    { strict, options }: { strict?: boolean, options?: JSONObject }
  ): Promise<DeviceMAttachTenantContent> {
    const attachedDevices = devices.filter(device => device._source.tenantId);

    if (strict && attachedDevices.length > 0) {
      const ids = attachedDevices.map(device => device._id).join(',')
      throw new BadRequestError(`These devices "${ids}" are already attached to a tenant`);
    }

    const documents = this.buildBulkDevices(bulkData);
    const results = {
      errors: [],
      successes: [],
    };

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      const tenantExists = await this.tenantExists(document.tenantId);

      if (strict && ! tenantExists) {
        throw new BadRequestError(`Tenant "${document.tenantId}" does not have a device-manager engine`);
      }
      else if (! strict && ! tenantExists) {
        results.errors.push(`Tenant "${document.tenantId}" does not have a device-manager engine`)
        continue;
      }

      const deviceDocuments = this.formatDevicesContent(devices, document);
      const enrichedDocuments = [];

      for (const deviceDocument of deviceDocuments) {
        const response = await global.app.trigger(
          'device-manager:device:attach-tenant:before',
          { index: document.tenantId, device: deviceDocument }
        );

        enrichedDocuments.push(response.device);
      }

      const { errors, successes } = await writeToDatabase(
        enrichedDocuments,
        async (result: mRequest[]): Promise<mResponse> => {
          const updated = await this.sdk.document.mUpdate(
            this.config.adminIndex,
            'devices',
            result,
            { strict, ...options });

          await this.sdk.document.mCreate(
            document.tenantId,
            'devices',
            result,
            { strict, ...options });

            return {
              successes: results.successes.concat(updated.successes),
              errors: results.errors.concat(updated.errors)
            }
        });

      results.successes.concat(successes);
      results.errors.concat(errors);

      for (const deviceDocument of enrichedDocuments) {
        await global.app.trigger(
          'device-manager:device:attach-tenant:after',
          { index: document.tenantId, device: deviceDocument }
        );
      }
    }

    return results;
  }

  async mDetachTenants (
    devices: Device[],
    bulkData: DeviceBulkContent[],
    { strict, options }: { strict?: boolean, options?: JSONObject }
  ) {
    const detachedDevices = devices.filter(device => {
      return ! device._source.tenantId || device._source.tenantId === null
    });

    if (strict && detachedDevices.length > 0) {
      const ids = detachedDevices.map(device => device._id).join(',')
      throw new BadRequestError(`Devices "${ids}" are not attached to a tenant`);
    }

    const linkedAssets = devices.filter(device => device._source.assetId);

    if (strict && linkedAssets.length > 0) {
      const ids = linkedAssets.map(device => device._id).join(',')
      throw new BadRequestError(`Devices "${ids}" are still linked to an asset`);
    }

    const builder = bulkData.map(data => {
      const { deviceId } = data;
      const device = devices.find(s => s._id === deviceId);
      return { tenantId: device._source.tenantId, deviceId }
    });

    const documents = this.buildBulkDevices(builder);

    const results = {
      errors: [],
      successes: [],
    };

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];

      const devicesContent = devices.filter(({ _id }) => document.deviceIds.includes(_id));
      const deviceDocuments = devicesContent.map(device => {
        return { _id: device._id, body: { tenantId: null } }
      })

      const { errors, successes } = await writeToDatabase(
        deviceDocuments,
        async (result: mRequest[]): Promise<mResponse> => {

        const updated = await this.sdk.document.mUpdate(
          this.config.adminIndex,
          'devices',
          result,
          { strict, ...options });

          await this.sdk.document.mDelete(
            document.tenantId,
            'devices',
            result.map(device => device._id),
            { strict, ...options });

          return {
            successes: results.successes.concat(updated.successes),
            errors: results.errors.concat(updated.errors)
          }
      })

      results.successes.concat(successes);
      results.errors.concat(errors);
    }

    return results;
  }

  async mLinkAssets (
    devices: Device[],
    bulkData: DeviceBulkContent[],
    { strict, options }: { strict?: boolean, options?: JSONObject }
  ) {

    const detachedDevices = devices.filter(device => {
      return ! device._source.tenantId || device._source.tenantId === null
    });

    if (strict && detachedDevices.length > 0) {
      const ids = detachedDevices.map(device => device._id).join(',')
      throw new PreconditionError(`Devices "${ids}" are not attached to a tenant`);
    }

    const builder = bulkData.map(data => {
      const { deviceId, assetId } = data;
      const device = devices.find(s => s._id === deviceId);
      return { tenantId: device._source.tenantId, deviceId, assetId }
    });

    const documents = this.buildBulkDevices(builder);

    const results = {
      errors: [],
      successes: [],
    };

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      const assets = await this.sdk.document.mGet(
        document.tenantId,
        'assets',
        document.assetIds);

      if (strict && assets.errors.length > 0) {
        throw new NotFoundError(`Assets "${assets.errors}" do not exist`);
      }

      const devicesContent = devices.filter(({ _id }) => document.deviceIds.includes(_id));
      const deviceDocuments = [];
      const assetDocuments = [];



      for (const device of devicesContent) {
        const decoder = this.decoders.get(device._source.model);
        const measures = await decoder.copyToAsset(device);
        const { assetId } = bulkData.find(({ deviceId }) => deviceId === device._id)

        const asset = assets.successes.find(a => a._id === assetId);

        if (!asset) {
          throw new NotFoundError(`Asset ${assetId} was not found`);
        }

        this.assertNotDuplicateMeasure(device, asset);
        this.assertDeviceNotLinkedToMultipleAssets(device);

        const doc_device = { _id: device._id, body: { assetId } };
        const doc_asset = { _id: asset._id, body: { measures } };

        const response = await global.app.trigger(
          'device-manager:device:link-asset:before',
          { device: doc_device, asset: doc_asset }
        );

        deviceDocuments.push(response.device);
        assetDocuments.push(response.asset);
      }

      const updatedDevice = await writeToDatabase(
        deviceDocuments,
        async (result: mRequest[]): Promise<mResponse> => {
          const updated = await this.sdk.document.mUpdate(
            this.config.adminIndex,
            'devices',
            result,
            { strict, ...options });

          await this.sdk.document.mUpdate(
            document.tenantId,
            'devices',
            result,
            { strict, ...options });

          return {
            successes: results.successes.concat(updated.successes),
            errors: results.errors.concat(updated.errors)
          }
      })

      const updatedAssets = await writeToDatabase(
        assetDocuments,
        async (result: mRequest[]): Promise<mResponse> => {
          const updated = await this.sdk.document.mUpdate(
            document.tenantId,
            'assets',
            result,
            { strict, ...options });

          return {
            successes: results.successes.concat(updated.successes),
            errors: results.errors.concat(updated.errors)
          }
        });
      

      results.successes.concat(updatedDevice.successes, updatedAssets.successes);
      results.errors.concat(updatedDevice.errors, updatedDevice.errors);

      for (const device of updatedDevice.successes) {
        const asset = updatedAssets.successes.find(asset => asset._id === device._source.assetId);

        global.app.trigger('device-manager:device:link-asset:after', {
          device,
          asset
        });
      }
    }


    return results;
  }

  async mUnlinkAssets (
    devices: Device[],
    { strict, options }: { strict?: boolean, options?: JSONObject }
  ) {
    const unlinkedDevices = devices.filter(device => !device._source.assetId);

    if (strict && unlinkedDevices.length > 0) {
      const ids = unlinkedDevices.map(d => d._id);
      throw new BadRequestError(`Devices "${ids}" are not linked to an asset`);
    }


    const builder = devices.map(device => {
      const { _id, _source } = device;
      return { tenantId: _source.tenantId, deviceId: _id, assetId: _source.assetId };
    });

    const documents = this.buildBulkDevices(builder);

    const results = {
      errors: [],
      successes: [],
    };

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];

      const devicesContent = devices.filter(({ _id }) => document.deviceIds.includes(_id));
      const deviceDocuments = [];
      const assetDocuments = [];

      for (const device of devicesContent) {
        deviceDocuments.push({ _id: device._id, body: { assetId: null } });

        const measures = await this.eraseAssetMeasure(document.tenantId, device);

        assetDocuments.push({ _id: device._source.assetId, body: { measures } });
      }

      const updatedDevice = await writeToDatabase(
        deviceDocuments,
        async (result: mRequest[]): Promise<mResponse> => {
          const updated = await this.sdk.document.mUpdate(
            this.config.adminIndex,
            'devices',
            result,
            { strict, ...options });

          await this.sdk.document.mUpdate(
            document.tenantId,
            'devices',
            result,
            { strict, ...options });

          return {
            successes: results.successes.concat(updated.successes),
            errors: results.errors.concat(updated.errors)
          }
      })

      const updatedAssets = await writeToDatabase(
        assetDocuments,
        async (result: mRequest[]): Promise<mResponse> => {

          const updated = await this.sdk.document.mUpdate(
            document.tenantId,
            'assets',
            result,
            { strict, ...options });

          return {
            successes: results.successes.concat(updated.successes),
            errors: results.errors.concat(updated.errors)
          }
        }
      )

      results.successes.concat(updatedDevice.successes, updatedAssets.successes);
      results.errors.concat(updatedDevice.errors, updatedDevice.errors);
    }

    return results;
  }

  async importDevices(
    devices: JSONObject,
    { strict, options }: { strict?: boolean, options?: JSONObject }) {
      const results = {
        errors: [],
        successes: [],
      };

    const deviceDocuments = devices
      .map((device: JSONObject) => ({ _id: device._id || uuidv4(), body: omit(device, ['_id']) }))

    await writeToDatabase(
      deviceDocuments,
      async (result: mRequest[]): Promise<mResponse> => {
        
        const created = await this.sdk.document.mCreate(
          'device-manager',
          'devices',
          result,
          { strict, ...options });

        return {
          successes: results.successes.concat(created.successes),
          errors: results.errors.concat(created.errors)
        }
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
            type: 'catalog',
            catalog: {
              deviceId: catalogContent.deviceId,
              authorized: catalogContent.authorized === 'false' ? false : true,
            }
          }
        }));

      await writeToDatabase(
        catalogDocuments,
        async (result: mRequest[]): Promise<mResponse> => {

          const created = await this.sdk.document.mCreate(
            this.config.adminIndex,
            this.config.configCollection,
            result,
            { strict, ...options });


          return {
            successes: results.successes.concat(created.successes),
            errors: results.errors.concat(created.errors)
          }
        });

     return results;
  }

  private async eraseAssetMeasure (tenantId: string, device: Device) {
    const { _source: { measures } } = await this.sdk.document.get(
      tenantId,
      'assets',
      device._source.assetId);


    for (const [measureName] of Object.entries(device._source.measures)) {
      if (measures[measureName]) {
        measures[measureName] = undefined;
      }
    }

    return measures;
  }

  private assertDeviceNotLinkedToMultipleAssets(device: Device) {
    if (device._source.assetId) {
      throw new BadRequestError(
        `Device "${device._id}" is already linked to the asset "${device._source.assetId}" you need to detach it first.`
      )
    }
  }

  private assertNotDuplicateMeasure(device: Device, asset: Document) {
    const deviceKeys = Object.keys(device._source.measures);
    const assetKeys = Object.keys(asset._source.measures);
    const hasKey = deviceKeys.find(e => assetKeys.includes(e));

    if (hasKey) {
      throw new BadRequestError(
        `Device ${device._id} is mesuring a value that is already mesured by another Device for the Asset ${asset._id}`
        )
    }
  }

  private async tenantExists (tenantId: string) {
    const { result: tenantExists } = await this.sdk.query({
      controller: 'device-manager/engine',
      action: 'exists',
      index: tenantId,
    });

    return tenantExists;
  }

  private buildBulkDevices (bulkData: DeviceBulkContent[]): DeviceBulkBuildedContent[] {
    const documents: DeviceBulkBuildedContent[] = [];
    for (let i = 0; i < bulkData.length; i++) {
      const { tenantId, deviceId, assetId } = bulkData[i];
      const document = documents.find(doc => doc.tenantId === tenantId);

      if (document) {
        document.deviceIds.push(deviceId);
        document.assetIds.push(assetId);
      }
      else {
        documents.push({ tenantId, deviceIds: [deviceId], assetIds: [assetId] })
      }
    }
    return documents;
  }

  private formatDevicesContent (
    devices: Device[],
    document: DeviceBulkBuildedContent
  ): mRequest[] {
    const devicesContent = devices.filter(device => document.deviceIds.includes(device._id));
    const devicesDocuments = devicesContent.map(device => {
      device._source.tenantId = document.tenantId;
      return { _id: device._id, body: device._source }
    });

    return devicesDocuments;
  }
}
