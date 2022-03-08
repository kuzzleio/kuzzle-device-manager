import csv from 'csvtojson';
import { CRUDController } from 'kuzzle-plugin-commons';
import {
  KuzzleRequest,
  BadRequestError,
  Plugin,
} from 'kuzzle';

import { DeviceBulkContent } from '../core-classes';
import { DeviceService } from '../core-classes';

export class DeviceController extends CRUDController {
  private deviceService: DeviceService;

  private get sdk () {
    return this.context.accessors.sdk;
  }

  constructor(plugin: Plugin, deviceService: DeviceService) {
    super(plugin, 'devices');

    this.deviceService = deviceService;

    this.definition = {
      actions: {
        attachEngine: {
          handler: this.attachEngine.bind(this),
          http: [{ path: 'device-manager/:index/devices/:_id/_attach', verb: 'put' }]
        },
        detachEngine: {
          handler: this.detachEngine.bind(this),
          http: [{ path: 'device-manager/devices/:_id/_detach', verb: 'delete' }]
        },
        importCatalog: {
          handler: this.importCatalog.bind(this),
          http: [{ path: 'device-manager/devices/_catalog', verb: 'post' }]
        },
        importDevices: {
          handler: this.importDevices.bind(this),
          http: [{ path: 'device-manager/devices/_import', verb: 'post' }]
        },
        linkAsset: {
          handler: this.linkAsset.bind(this),
          http: [{ path: 'device-manager/:index/devices/:_id/_link/:assetId', verb: 'put' }]
        },
        mAttachEngines: {
          handler: this.mAttachEngines.bind(this),
          http: [{ path: 'device-manager/devices/_mAttach', verb: 'put' }]
        },
        mDetachEngines: {
          handler: this.mDetachEngines.bind(this),
          http: [{ path: 'device-manager/devices/_mDetach', verb: 'put' }]
        },
        mLinkAssets: {
          handler: this.mLinkAssets.bind(this),
          http: [{ path: 'device-manager/devices/_mLink', verb: 'put' }]
        },
        mUnlinkAssets: {
          handler: this.mUnlinkAssets.bind(this),
          http: [{ path: 'device-manager/devices/_mUnlink', verb: 'put' }]
        },
        prunePayloads: {
          handler: this.prunePayloads.bind(this),
          http: [{ path: 'device-manager/devices/_prunePayloads', verb: 'delete' }]
        },
        search: {
          handler: this.search.bind(this),
          http: [
            { path: 'device-manager/:index/devices/_search', verb: 'post' },
            { path: 'device-manager/:index/devices/_search', verb: 'get' }
          ]
        },
        unlinkAsset: {
          handler: this.unlinkAsset.bind(this),
          http: [{ path: 'device-manager/:index/devices/:_id/_unlink', verb: 'delete' }]
        },
        update: {
          handler: this.update.bind(this),
          http: [{ path: 'device-manager/:index/devices/:_id', verb: 'put' }]
        },
      }
    };
  }

  /**
   * Attach a device to a tenant
   */
  async attachEngine (request: KuzzleRequest) {
    const engineId = request.getIndex();
    const deviceId = request.getId();

    await this.deviceService.attachEngine(engineId, deviceId, request.input.args);
  }

  /**
   * Attach multiple devices to multiple tenants
   */
  async mAttachEngines (request: KuzzleRequest) {
    const { bulkData } = await this.mParseRequest(request);

    const promises = [];

    for (const { engineId, deviceId } of bulkData) {
      promises.push(
        this.deviceService.attachEngine(engineId, deviceId, request.input.args));
    }

    return await Promise.all(promises);
  }

  /**
   * Unattach a device from it's tenant
   */
  async detachEngine (request: KuzzleRequest) {
    const deviceId = request.getId();

    await this.deviceService.detachEngine(deviceId, request.input.args);
  }

  /**
   * Detach multiple devices from multiple tenants
   */
  async mDetachEngines (request: KuzzleRequest) {
    const { bulkData } = await this.mParseRequest(request);

    const promises = [];

    for (const { deviceId } of bulkData) {
      promises.push(
        this.deviceService.detachEngine(deviceId, request.input.args));
    }

    return await Promise.all(promises);
  }

  /**
   * Link a device to an asset.
   * @todo there is no restriction according to tenant index?
   */
  async linkAsset (request: KuzzleRequest) {
    const assetId = request.getString('assetId');
    const deviceId = request.getId();

    await this.deviceService.linkAsset(deviceId, assetId, request.input.args);
  }

  /**
   * Link multiple devices to multiple assets.
   */
  async mLinkAssets (request: KuzzleRequest) {
    const { bulkData } = await this.mParseRequest(request);

    for (const { deviceId, assetId } of bulkData) {
      // Cannot be done in parallel because we need to copy previous measures
      await this.deviceService.linkAsset(deviceId, assetId, request.input.args);
    }
  }

  /**
   * Unlink a device from an asset.
   */
  async unlinkAsset (request: KuzzleRequest) {
    const deviceId = request.getId();

    await this.deviceService.unlinkAsset(deviceId, request.input.args);
  }

  /**
   * Unlink multiple device from multiple assets.
   */
  async mUnlinkAssets (request: KuzzleRequest) {
    const { bulkData } = await this.mParseRequest(request);

    for (const { deviceId } of bulkData) {
      // Cannot be done in parallel because we need to keep previous measures
      await this.deviceService.unlinkAsset(deviceId, request.input.args);
    }
  }

  /**
   * Clean payload collection for a time period
   */
  async prunePayloads (request: KuzzleRequest) {
    const body = request.getBody();

    const date = new Date().setDate(new Date().getDate() - body.days || 7);
    const filter = [];
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
      filter.push({ term: { valid: true } });
    }

    return this.as(request.context.user).bulk.deleteByQuery(
      this.config.adminIndex,
      'payloads',
      { query: { bool: { filter } } });
  }

  async importDevices (request: KuzzleRequest) {
    const content = request.getBodyString('csv');

    const devices = await csv({ delimiter: 'auto' }).fromString(content);

    return this.deviceService.importDevices(
      devices,
      {
        options: { ...request.input.args },
        strict: true
      });
  }

  async importCatalog (request: KuzzleRequest) {
    const content = request.getBodyString('csv');

    const catalog = await csv({ delimiter: 'auto' }).fromString(content);

    return this.deviceService.importCatalog(
      catalog,
      {
        options: { ...request.input.args },
        strict: true
      });
  }

  private async mParseRequest (request: KuzzleRequest) {
    const body = request.input.body;

    let bulkData: DeviceBulkContent[];

    if (body.csv) {
      const lines = await csv({ delimiter: 'auto' }).fromString(body.csv);

      bulkData = lines.map(({ engineId, deviceId, assetId}) => ({
        assetId,
        deviceId,
        engineId
      }));
    }
    else if (body.records) {
      bulkData = body.records;
    }
    else if (body.deviceIds) {
      bulkData = body.deviceIds.map((deviceId: string) => ({ deviceId }));
    }
    else {
      throw new BadRequestError('Malformed request missing property csv, records, deviceIds');
    }

    const strict = request.getBoolean('strict');

    return { bulkData, strict };
  }
}
