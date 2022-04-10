import csv from 'csvtojson';
import { CRUDController } from 'kuzzle-plugin-commons';
import {
  KuzzleRequest,
  BadRequestError,
  Plugin,
} from 'kuzzle';

import { AttachRequest, DeviceBulkContent, LinkRequest } from '../core-classes';
import { DeviceService } from '../core-classes';
import { Device } from '../models';

export class DeviceController extends CRUDController {
  private deviceService: DeviceService;

  constructor(plugin: Plugin, deviceService: DeviceService) {
    super(plugin, 'devices');

    this.deviceService = deviceService;

    /* eslint-disable sort-keys */
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
        unlinkAsset: {
          handler: this.unlinkAsset.bind(this),
          http: [{ path: 'device-manager/:index/devices/:_id/_unlink', verb: 'delete' }]
        },

        // CRUD Controller
        create: {
          handler: this.create.bind(this),
          http: [{ path: 'device-manager/:index/devices', verb: 'post' }]
        },
        search: {
          handler: this.search.bind(this),
          http: [
            { path: 'device-manager/:index/devices/_search', verb: 'post' },
            { path: 'device-manager/:index/devices/_search', verb: 'get' }
          ]
        },
        update: {
          handler: this.update.bind(this),
          http: [{ path: 'device-manager/:index/devices/:_id', verb: 'put' }]
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ path: 'device-manager/:index/devices/:_id', verb: 'delete' }]
        },
      }
    };
    /* eslint-enable sort-keys */
  }

  /**
   * Create and provision a new device
   */
  async create (request: KuzzleRequest) {
    // @todo engine gestion?
    const model = request.getBodyString('model');
    const reference = request.getBodyString('reference');

    if (! request.input.args._id) {
      request.input.args._id = Device.id(model, reference);
    }

    request.input.args.index = request.getString('engineId');

    return super.create(request);
  }

  async update (request: KuzzleRequest) {
    request.input.args.index = request.getString('engineId');

    return super.update(request);
  }

  async search (request: KuzzleRequest) {
    request.input.args.index = request.getString('engineId');

    return super.search(request);
  }

  async delete (request: KuzzleRequest) {
    request.input.args.index = request.getString('engineId');

    return super.delete(request);
  }

  /**
   * Attach a device to a tenant
   */
  async attachEngine (request: KuzzleRequest) {
    const engineId = request.getString('engineId');
    const deviceId = request.getId();
    const refresh = request.getRefresh();
    const strict = request.getBoolean('strict');

    const attacheRequest: AttachRequest = {
      deviceId,
      engineId,
    };

    console.log({attacheRequest})

    await this.deviceService.attachEngine(attacheRequest, { refresh, strict });
  }

  /**
   * Attach multiple devices to multiple tenants
   */
  async mAttachEngines (request: KuzzleRequest) {
    const { bulkData } = await this.mParseRequest(request);
    const refresh = request.getRefresh();
    const strict = request.getBoolean('strict');

    const promises = [];

    for (const { engineId, deviceId } of bulkData) {
      const attacheRequest: AttachRequest = {
        deviceId,
        engineId,
      };

      promises.push(
        this.deviceService.attachEngine(attacheRequest, { refresh, strict }));
    }

    return await Promise.all(promises);
  }

  /**
   * Unattach a device from it's tenant
   */
  async detachEngine (request: KuzzleRequest) {
    const deviceId = request.getId();
    const refresh = request.getRefresh();
    const strict = request.getBoolean('strict');

    await this.deviceService.detachEngine(deviceId, { refresh, strict });
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
    const measuresNames = request.getBodyObject('measuresNames', {});
    const refresh = request.getRefresh();

    const linkRequest: LinkRequest = {
      assetId,
      deviceId,
      measuresNames,
    };

    await this.deviceService.linkAsset(linkRequest, { refresh });
  }

  /**
   * Link multiple devices to multiple assets.
   */
  async mLinkAssets (request: KuzzleRequest) {
    const { bulkData } = await this.mParseRequest(request);
    const refresh = request.getRefresh();

    for (const { deviceId, assetId } of bulkData) {
      const linkRequest: LinkRequest = {
        assetId,
        deviceId,
        // @todo handle measure names
      };

      // Cannot be done in parallel because we need to copy previous measures
      await this.deviceService.linkAsset(linkRequest, { refresh });
    }
  }

  /**
   * Unlink a device from an asset.
   */
  async unlinkAsset (request: KuzzleRequest) {
    const deviceId = request.getId();
    const refresh = request.getRefresh();
    const strict = request.getBoolean('strict');

    await this.deviceService.unlinkAsset(deviceId, { refresh, strict });
  }

  /**
   * Unlink multiple device from multiple assets.
   */
  async mUnlinkAssets (request: KuzzleRequest) {
    const { bulkData } = await this.mParseRequest(request);
    const refresh = request.getRefresh();
    const strict = request.getBoolean('strict');

    for (const { deviceId } of bulkData) {
      // Cannot be done in parallel because we need to keep previous measures
      await this.deviceService.unlinkAsset(deviceId, { refresh, strict });
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
    const refresh = request.getRefresh();

    const devices = await csv({ delimiter: 'auto' }).fromString(content);

    return this.deviceService.importDevices(
      devices,
      {
        refresh,
        strict: true
      });
  }

  async importCatalog (request: KuzzleRequest) {
    const content = request.getBodyString('csv');
    const refresh = request.getRefresh();

    const catalog = await csv({ delimiter: 'auto' }).fromString(content);

    return this.deviceService.importCatalog(
      catalog,
      {
        refresh,
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
