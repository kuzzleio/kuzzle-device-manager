import csv from 'csvtojson';
import {
  KuzzleRequest,
  EmbeddedSDK,
  BadRequestError,
  Plugin,
  NotFoundError
} from 'kuzzle';

import { CRUDController } from './CRUDController';
import { Device } from '../models';
import { DeviceBulkContent } from '../core-classes';
import { DeviceService } from '../core-classes';

export class DeviceController extends CRUDController {
  private deviceService: DeviceService;

  get sdk(): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor(plugin: Plugin, deviceService: DeviceService) {
    super(plugin, 'devices');

    this.deviceService = deviceService;

    this.definition = {
      actions: {
        update: {
          handler: this.update.bind(this),
          http: [{ verb: 'put', path: 'device-manager/:index/devices/:_id' }]
        },
        search: {
          handler: this.search.bind(this),
          http: [
            { verb: 'post', path: 'device-manager/:index/devices/_search' },
            { verb: 'get', path: 'device-manager/:index/devices/_search' }
          ]
        },
        attachTenant: {
          handler: this.attachTenant.bind(this),
          http: [{ verb: 'put', path: 'device-manager/:index/devices/:_id/_attach' }]
        },
        mAttachTenant: {
          handler: this.mAttachTenant.bind(this),
          http: [{ verb: 'put', path: 'device-manager/devices/_mAttach' }]
        },
        detachTenant: {
          handler: this.detachTenant.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/devices/:_id/_detach' }]
        },
        mDetachTenant: {
          handler: this.mDetachTenant.bind(this),
          http: [{ verb: 'put', path: 'device-manager/devices/_mDetach' }]
        },
        linkAsset: {
          handler: this.linkAsset.bind(this),
          http: [{ verb: 'put', path: 'device-manager/:index/devices/:_id/_link/:assetId' }]
        },
        mLinkAsset: {
          handler: this.mLinkAsset.bind(this),
          http: [{ verb: 'put', path: 'device-manager/devices/_mLink' }]
        },
        unlinkAsset: {
          handler: this.unlinkAsset.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/:index/devices/:_id/_unlink' }]
        },
        mUnlinkAsset: {
          handler: this.mUnlinkAsset.bind(this),
          http: [{ verb: 'put', path: 'device-manager/devices/_mUnlink' }]
        },
        prunePayloads: {
          handler: this.prunePayloads.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/devices/_prunePayloads' }]
        }
      }
    };
  }

  /**
   * Attach a device to a tenant
   */
  async attachTenant (request: KuzzleRequest) {
    const tenantId = request.getIndex();
    const deviceId = request.getId();

    const document = { tenantId: tenantId, deviceId: deviceId };
    const devices = await this.mGetDevice([document]);

    await this.deviceService.mAttachTenant(
      devices,
      [document],
      {
        strict: true,
        options:  { ...request.input.args }
      });
  }

  /**
   * Attach multiple devices to multiple tenants
   */
  async mAttachTenant (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mAttachTenant(
      devices,
      bulkData,
      {
        strict,
        options:  { ...request.input.args }
      });
  }

  /**
   * Unattach a device from it's tenant
   */
  async detachTenant (request: KuzzleRequest) {
    const deviceId = request.getId();

    const document: DeviceBulkContent = { deviceId };
    const devices = await this.mGetDevice([document]);

    await this.deviceService.mDetachTenant(
      devices,
      [document],
      {
        strict: true,
        options:  { ...request.input.args }
      });
  }

  /**
   * Detach multiple devices from multiple tenants
   */
  async mDetachTenant (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mDetachTenant(
      devices,
      bulkData,
      {
        strict,
        options:  { ...request.input.args }
      });
  }

  /**
   * Link a device to an asset.
   * @todo there is not restriction according to tenant index?
   */
  async linkAsset (request: KuzzleRequest) {
    const assetId = request.getString('assetId');
    const deviceId = request.getId();

    const document: DeviceBulkContent = { deviceId, assetId };
    const devices = await this.mGetDevice([document]);

    await this.deviceService.mLinkAsset(
      devices,
      [document],
      {
        strict: true,
        options:  { ...request.input.args }
      });
  }

  /**
   * Link multiple devices to multiple assets.
   */
  async mLinkAsset (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mLinkAsset(
      devices,
      bulkData,
      {
        strict,
        options:  { ...request.input.args }
      });
  }

  /**
   * Unlink a device from an asset.
   */
   async unlinkAsset (request: KuzzleRequest) {
    const deviceId = request.getId();

    const document: DeviceBulkContent = { deviceId };
    const devices = await this.mGetDevice([document]);

    await this.deviceService.mUnlinkAsset(
      devices,
      {
        strict: true,
        options:  { ...request.input.args }
      });
  }

  /**
   * UnlinkAsset multiple device from multiple assets.
   */
  async mUnlinkAsset (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mUnlinkAsset(
      devices,
      {
        strict,
        options: { ...request.input.args }
      });
  }

  /**
   * Clean payload collection for a time period
   */
  async prunePayloads (request: KuzzleRequest) {
    const body = request.getBody();

    const date = new Date().setDate(new Date().getDate() - body.days || 7);
    const filter = []
    filter.push({
        range: {
          '_kuzzle_info.createdAt': {
            lt: date
          }
        }
      });

    if (body.deviceModel) {
      filter.push({ term: { deviceModel: body.deviceModel } });
    }

    if (body.keepInvalid) {
      filter.push({ term: { valid: true } })
    }

    return await this.as(request.context.user).bulk.deleteByQuery(
      this.config.adminIndex,
      'payloads',
      { query: { bool: { filter } } });
  }



  private async mGetDevice (devices: DeviceBulkContent[]): Promise<Device[]> {
    const deviceIds = devices.map(doc => doc.deviceId);
    const result: any = await this.sdk.document.mGet(
      this.config.adminIndex,
      'devices',
      deviceIds
    )

    if (result.errors.length > 0) {
      const ids = result.errors.join(',');
      throw(new NotFoundError(`Device(s) "${ids}" not found`));
    }

    return result.successes.map((document: any) => new Device(document._source, document._id));
  }

  private async mParseRequest (request: KuzzleRequest) {
    const body = request.input.body;

    let bulkData: DeviceBulkContent[];

    if (body.csv) {
      const lines = await csv({ delimiter: 'auto' })
        .fromString(body.csv);

      bulkData = lines.map(({ tenantId, deviceId, assetId}) => ({
        tenantId,
        deviceId,
        assetId
      }));
    }
    else if (body.records) {
      bulkData = body.records;
    }
    else if (body.deviceIds) {
      bulkData = body.deviceIds.map((deviceId: string) => ({ deviceId }));
    }
    else {
      throw new BadRequestError(`Malformed request missing property csv, records, deviceIds`);
    }

    const strict = request.getBoolean('strict');

    return { strict, bulkData };
  }
}
