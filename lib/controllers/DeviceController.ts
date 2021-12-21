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
        mAttachTenants: {
          handler: this.mAttachTenants.bind(this),
          http: [{ verb: 'put', path: 'device-manager/devices/_mAttach' }]
        },
        detachTenant: {
          handler: this.detachTenant.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/devices/:_id/_detach' }]
        },
        mDetachTenants: {
          handler: this.mDetachTenants.bind(this),
          http: [{ verb: 'put', path: 'device-manager/devices/_mDetach' }]
        },
        linkAsset: {
          handler: this.linkAsset.bind(this),
          http: [{ verb: 'put', path: 'device-manager/:index/devices/:_id/_link/:assetId' }]
        },
        mLinkAssets: {
          handler: this.mLinkAssets.bind(this),
          http: [{ verb: 'put', path: 'device-manager/devices/_mLink' }]
        },
        unlinkAsset: {
          handler: this.unlinkAsset.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/:index/devices/:_id/_unlink' }]
        },
        mUnlinkAssets: {
          handler: this.mUnlinkAssets.bind(this),
          http: [{ verb: 'put', path: 'device-manager/devices/_mUnlink' }]
        },
        prunePayloads: {
          handler: this.prunePayloads.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/devices/_prunePayloads' }]
        },
        importDevices: {
          handler: this.importDevices.bind(this),
          http: [{ verb: 'post', path: 'device-manager/devices/_import' }]
        },
        importCatalog: {
          handler: this.importCatalog.bind(this),
          http: [{ verb: 'post', path: 'device-manager/devices/_catalog' }]
        }
      }
    };
  }

  async update (request: KuzzleRequest) {
    const deviceId = request.getId();
    const body = request.getBody();
    const devices = await this.mGetDevice([{ deviceId }]);

    const response = await global.app.trigger(
      'device-manager:device:update:before', {
      device: devices[0],
      updates: body,
    });

    request.input.body = response.updates;
    const result = await super.update(request);

    await global.app.trigger('device-manager:device:update:after', {
      device: devices[0],
      updates: result._source,
    });

    return result;
  }

  /**
   * Attach a device to a tenant
   */
  async attachTenant (request: KuzzleRequest) {
    const tenantId = request.getIndex();
    const deviceId = request.getId();

    const document = { tenantId: tenantId, deviceId: deviceId };
    const devices = await this.mGetDevice([document]);

    await this.deviceService.mAttachTenants(
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
  async mAttachTenants (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mAttachTenants(
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

    await this.deviceService.mDetachTenants(
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
  async mDetachTenants (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mDetachTenants(
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

    await this.deviceService.mLinkAssets(
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
  async mLinkAssets (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mLinkAssets(
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

    await this.deviceService.mUnlinkAssets(
      devices,
      {
        strict: true,
        options:  { ...request.input.args }
      });
  }

  /**
   * Unlink multiple device from multiple assets.
   */
  async mUnlinkAssets (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mUnlinkAssets(
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

    return this.as(request.context.user).bulk.deleteByQuery(
      this.config.adminIndex,
      'payloads',
      { query: { bool: { filter } } });
  }

  async importDevices (request: KuzzleRequest) {
    const content = request.getBodyString('csv');

    const devices = await csv({ delimiter: 'auto' })
      .fromString(content);

    return this.deviceService.importDevices(
      devices,
      {
        strict: true,
        options: { ...request.input.args }
      });
  }

  async importCatalog (request: KuzzleRequest) {
    const content = request.getBodyString('csv');

    const catalog = await csv({ delimiter: 'auto' })
      .fromString(content);

    return this.deviceService.importCatalog(
      catalog,
      {
        strict: true,
        options: { ...request.input.args }
      });
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
