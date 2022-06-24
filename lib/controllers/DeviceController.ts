import csv from 'csvtojson';
import { CRUDController } from 'kuzzle-plugin-commons';
import {
  BadRequestError,
  JSONObject,
  KuzzleRequest,
  PluginImplementationError,
} from 'kuzzle';
import _ from 'lodash';

import { DeviceBulkContent } from '../core-classes';
import { DeviceService } from '../core-classes';
import { DeviceManagerPlugin } from '../DeviceManagerPlugin';
import { DeviceContent, DeviceManagerConfiguration, MeasureNamesLink } from '../types';
import { AttachRequest, LinkRequest } from '../types/Request';
import { Device } from '../models';

export class DeviceController extends CRUDController {
  protected config: DeviceManagerConfiguration;

  private deviceService: DeviceService;

  constructor (plugin: DeviceManagerPlugin, deviceService: DeviceService) {
    super(plugin, 'devices');

    this.deviceService = deviceService;

    /* eslint-disable sort-keys */
    this.definition = {
      actions: {
        attachEngine: {
          handler: this.attachEngine.bind(this),
          http: [{ path: 'device-manager/:engineId/devices/:_id/_attach', verb: 'put' }]
        },
        detachEngine: {
          handler: this.detachEngine.bind(this),
          http: [{ path: 'device-manager/devices/:_id/_detach', verb: 'delete' }]
        },
        importDevices: {
          handler: this.importDevices.bind(this),
          http: [{ path: 'device-manager/devices/_import', verb: 'post' }]
        },
        linkAsset: {
          handler: this.linkAsset.bind(this),
          http: [{ path: 'device-manager/devices/:_id/_link/:assetId', verb: 'put' }]
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
          http: [{ path: 'device-manager/:engineId/devices/:_id/_unlink', verb: 'delete' }]
        },

        // CRUD Controller
        create: {
          handler: this.create.bind(this),
          http: [{ path: 'device-manager/:engineId/devices', verb: 'post' }]
        },

        // TOSEE : Delete a measure from device by `deviceMeasureName`
      }
    };
    /* eslint-enable sort-keys */
  }

  /**
   * Create and provision a new device
   */
  async create (request: KuzzleRequest) {
    const engineId = request.getString('engineId');
    const model = request.getBodyString('model');
    const reference = request.getBodyString('reference');
    const metadata = request.getBodyObject('metadata', {});
    const refresh = request.getRefresh();

    let assetId = null;
    try {
      assetId = request.getBodyString('assetId');
    }
    catch (error) {}
    const measureNamesLinks = request.getBodyArray('measureNamesLinks', []);

    if (measureNamesLinks.length && ! this.validateMeasureNamesLinks(measureNamesLinks)) {
      throw new PluginImplementationError('The linkRequest provided is incorrectly formed');
    }

    const deviceContent: DeviceContent = {
      measures: [],
      metadata,
      model,
      reference,
    };

    const linkRequest: LinkRequest = assetId && measureNamesLinks.length
      ? {
        assetId,
        deviceLink: { deviceId: Device.id(model, reference), measureNamesLinks }
      }
      : null;

    const device = await this.deviceService.create(deviceContent, {
      engineId,
      linkRequest,
      refresh,
    });

    return device;
  }

  // @todo to be implemented
  async update (): Promise<any> {
    throw new PluginImplementationError('Not available');
  }

  // @todo to be implemented
  async search () {
    throw new PluginImplementationError('Not available');
  }

  // @todo to be implemented
  async delete (): Promise<any> {
    throw new PluginImplementationError('Not available');
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
   * Detach a device from it's tenant
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
    const deviceId = request.getId();
    const assetId = request.getString('assetId');
    const refresh = request.getRefresh();
    const jsonMeasureNamesLinks = request.getBodyArray('measureNamesLinks');

    if (! this.validateMeasureNamesLinks(jsonMeasureNamesLinks)) {
      throw new PluginImplementationError('The linkRequest provided is incorrectly formed');
    }

    const measureNamesLinks = jsonMeasureNamesLinks as MeasureNamesLink[];

    return await this.deviceService.linkAsset({
      assetId,
      deviceLink: { deviceId, measureNamesLinks }
    }, { refresh });
  }

  /**
   * Link multiple devices to multiple assets.
   */
  async mLinkAssets (request: KuzzleRequest) {
    const jsonLinkRequests = request.getBodyArray('linkRequests');
    const refresh = request.getRefresh();

    for (const jsonLinkRequest of jsonLinkRequests) {
      if (! this.validateLinkRequest(jsonLinkRequest)) {
        throw new PluginImplementationError('The linkRequest provided is incorrectly formed');
      }
    }

    const linkRequests = jsonLinkRequests as LinkRequest[];

    const valids = [];
    const invalids = [];

    for (const linkRequest of linkRequests) {
      // Cannot be done in parallel because we need to keep previous measures
      try {
        const result = await this.deviceService.linkAsset(linkRequest, { refresh });
        valids.push(result);
      }
      catch (error) {
        invalids.push({ error, linkRequest });
      }
    }

    return { invalids, valids };
  }

  /**
   * Unlink a device from an asset.
   */
  async unlinkAsset (request: KuzzleRequest) {
    const deviceId = request.getId();
    const refresh = request.getRefresh();
    const strict = request.getBoolean('strict');

    return await this.deviceService.unlinkAsset(deviceId, { refresh, strict });
  }

  /**
   * Unlink multiple device from multiple assets.
   */
  async mUnlinkAssets (request: KuzzleRequest) {
    const deviceIds = request.getBodyArray('deviceIds');
    const refresh = request.getRefresh();
    const strict = request.getBoolean('strict');

    const valids = [];
    const invalids = [];

    for (const deviceId of deviceIds) {
      // Cannot be done in parallel because we need to keep previous measures
      try {
        const result = await this.deviceService.unlinkAsset(deviceId, { refresh, strict });
        valids.push(result);
      }
      catch (error) {
        invalids.push({ error, linkRequest: deviceId });
      }
    }

    return { invalids, valids };
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

  private async mParseRequest (request: KuzzleRequest) {
    const body = request.input.body;

    let bulkData: DeviceBulkContent[];

    if (body.csv) {
      const lines = await csv({ delimiter: 'auto' }).fromString(body.csv);

      bulkData = lines.map(({ engineId, deviceId, assetId }) => ({
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

  private validateLinkRequest (toValidate: JSONObject) {
    if (! (_.has(toValidate, 'assetId')
      && _.has(toValidate, 'deviceLink')
      && _.has(toValidate.deviceLink, 'deviceId')
      && _.has(toValidate.deviceLink, 'measureNamesLinks'))
    ) {
      return false;
    }

    return this.validateMeasureNamesLinks(toValidate.deviceLink.measureNamesLinks);
  }

  private validateMeasureNamesLinks (toValidate: JSONObject) {
    if (! Array.isArray(toValidate)) {
      return false;
    }

    const measureNamesLinks = toValidate as MeasureNamesLink[];

    for (const measureNamesLink of measureNamesLinks) {
      if (! (_.has(measureNamesLink, 'assetMeasureName')
        && _.has(measureNamesLink, 'deviceMeasureName'))) {
        return false;
      }
    }
    return true;
  }
}
