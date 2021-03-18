import {
  JSONObject,
  PluginContext,
  EmbeddedSDK,
  BadRequestError,
} from 'kuzzle';

import {
  DeviceBulkBuildedContent,
  DeviceBulkContent,
  DeviceMAttachementContent,
  DeviceMRequestContent
} from '../types';

import { Decoder } from '../decoders';
import { Device } from '../models';

export class DeviceService {
  private config: JSONObject;
  private context: PluginContext;

  get sdk(): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor(config: JSONObject, context: PluginContext) {
    this.config = config;
    this.context = context;
  }

  async mAttach (devices: Device[], bulkData: DeviceBulkContent[], { strict }): Promise<DeviceMAttachementContent> {
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

      const { errors, successes } = await this.writeToDatabase(
        deviceDocuments,
        async (deviceDocuments: DeviceMRequestContent[]): Promise<JSONObject> => {
          const updated = await this.sdk.document.mUpdate(
            this.config.adminIndex,
            'devices',
            deviceDocuments);

          await this.sdk.document.mCreate(
            document.tenantId,
            'devices',
            deviceDocuments);

            return {
              successes: results.successes.concat(updated.successes),
              errors: results.errors.concat(updated.errors)
            }
        });

      results.successes.concat(successes);
      results.errors.concat(errors);
    }

    return results;
  }

  async detach (device: Device) {
    if (! device._source.tenantId) {
      throw new BadRequestError(`Device "${device._id}" is not attached to a tenant`);
    }

    if (device._source.assetId) {
      throw new BadRequestError(`Device "${device._id}" is still linked to an asset`);
    }

    await this.sdk.document.delete(
      device._source.tenantId,
      'devices',
      device._id);

    await this.sdk.document.update(
      this.config.adminIndex,
      'devices',
      device._id,
      { tenantId: null });
  }


  async linkAsset (device: Device, assetId: string, decoders: Map<string, Decoder>) {
    if (!device._source.tenantId) {
      throw new BadRequestError(`Device "${device._id}" is not attached to a tenant`);
    }

    const assetExists = await this.sdk.document.exists(
      device._source.tenantId,
      'assets',
      assetId);

    if (!assetExists) {
      throw new BadRequestError(`Asset "${assetId}" does not exists`);
    }

    await this.sdk.document.update(
      this.config.adminIndex,
      'devices',
      device._id,
      { assetId });

    await this.sdk.document.update(
      device._source.tenantId,
      'devices',
      device._id,
      { assetId });

    const decoder = decoders.get(device._source.model);

    const assetMeasures = await decoder.copyToAsset(device);

    await this.sdk.document.update(
      device._source.tenantId,
      'assets',
      assetId,
      { measures: assetMeasures });
   }

  async unlink (device: Device) {
    if (! device._source.assetId) {
      throw new BadRequestError(`Device "${device._id}" is not linked to an asset`);
    }

    await this.sdk.document.update(
      this.config.adminIndex,
      'devices',
      device._id,
      { assetId: null });

    await this.sdk.document.update(
      device._source.tenantId,
      'devices',
      device._id,
      { assetId: null });

    // @todo only remove the measures coming from the unlinked device
    await this.sdk.document.update(
      device._source.tenantId,
      'assets',
      device._source.assetId,
      { measures: null });
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
      const { tenantId, deviceId } = bulkData[i];
      const document = documents.find(doc => doc.tenantId === tenantId);

      if (document) {
        document.deviceIds.push(deviceId);
      }
      else {
        documents.push({ tenantId, deviceIds: [deviceId] })
      }
    }
    return documents;
  }

  private formatDevicesContent (devices: Device[], document: DeviceBulkBuildedContent): DeviceMRequestContent[] {
    const devicesContent = devices.filter(device => document.deviceIds.includes(device._id));
    const devicesDocuments = devicesContent.map(device => {
      device._source.tenantId = document.tenantId;
      return { _id: device._id, body: device._source }
    });

    return devicesDocuments;
  }

  private async writeToDatabase (deviceDocuments: DeviceMRequestContent[], writer: (deviceDocuments: DeviceMRequestContent[]) => Promise<JSONObject>) {
    const results = {
      errors: [],
      successes: [],
    }

    const limit = global.kuzzle.config.limits.documentsWriteCount;

    if (deviceDocuments.length <= limit) {
      const { successes, errors } = await writer(deviceDocuments);
      results.successes.push(successes);
      results.errors.push(errors);

      return results;
    }

    const writeMany = async (start: number, end: number) => {
      const devices = deviceDocuments.slice(start, end);
      const { successes, errors } = await writer(devices);

      results.successes.push(successes);
      results.errors.push(errors);
    }

    let offset = 0;
    let offsetLimit = limit;
    let done = false;

    while (! done) {
      await writeMany(offset, offsetLimit)

      offset += limit;
      offsetLimit += limit;

      if (offsetLimit >= deviceDocuments.length) {
        done = true;
        await writeMany(offset, deviceDocuments.length);
      }
    }

    return results;
  }
}
