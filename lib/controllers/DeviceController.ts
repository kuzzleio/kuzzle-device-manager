import csv from 'csvtojson';
import {
  KuzzleRequest,
  EmbeddedSDK,
  JSONObject,
  PluginContext,
  BadRequestError
} from 'kuzzle';

import { CRUDController } from './CRUDController';
import { Decoder } from '../decoders';
import { Device } from '../models';
import { DeviceBulkContent } from '../types';
import { DeviceService } from '../services';

export class DeviceController extends CRUDController {
  private decoders: Map<string, Decoder>;
  private deviceService: DeviceService;

  get sdk(): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor(config: JSONObject, context: PluginContext, decoders: Map<string, Decoder>, deviceService: DeviceService) {
    super(config, context, 'devices');

    this.decoders = decoders;

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
        mAttach: {
          handler: this.mAttach.bind(this),
          http: [{ verb: 'put', path: 'device-manager/devices/_mAttach' }]
        },
        detach: {
          handler: this.detach.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/devices/:_id/_detach' }]
        },
        mDetach: {
          handler: this.mDetach.bind(this),
          http: [{ verb: 'put', path: 'device-manager/devices/_mDetach' }]
        },
        linkAsset: {
          handler: this.linkAsset.bind(this),
          http: [{ verb: 'put', path: 'device-manager/:index/devices/:_id/_link/:assetId' }]
        },
        mLink: {
          handler: this.mLink.bind(this),
          http: [{ verb: 'put', path: 'device-manager/devices/_mLink' }]
        },
        unlink: {
          handler: this.unlink.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/:index/devices/:_id/_unlink' }]
        },
        mUnlink: {
          handler: this.mUnlink.bind(this),
          http: [{ verb: 'put', path: 'device-manager/devices/_mUnlink' }]
        },
        prunePayloads: {
          handler: this.prunePayloads.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/devices/_prunePayloads' }]
        },
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

    await this.deviceService.mAttach(devices, [document], { strict: true, options:  { ...request.input.args } });
  }

  /**
   * Attach multiple devices to multiple tenants
   */
  async mAttach (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mAttach(devices, bulkData, { strict, options:  { ...request.input.args } });
  }

  /**
   * Unattach a device from it's tenant
   */
  async detach (request: KuzzleRequest) {
    const deviceId = request.getId();

    const document: DeviceBulkContent = { deviceId };
    const devices = await this.mGetDevice([document]);

    await this.deviceService.mDetach(devices, [document], { strict: true, options:  { ...request.input.args } });
  }

  /**
   * Unattach multiple devices from multiple tenants
   */
  async mDetach (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mDetach(devices, bulkData, { strict, options:  { ...request.input.args } });
  }

  /**
   * Link a device to an asset.
   */
  async linkAsset (request: KuzzleRequest) {
    const assetId = request.getString('assetId');
    const deviceId = request.getId();

    const document: DeviceBulkContent = { deviceId, assetId };
    const devices = await this.mGetDevice([document]);

    await this.deviceService.mLink(devices, [document], this.decoders, { strict: true, options:  { ...request.input.args } });
  }

  /**
   * Link multiple devices to multiple assets.
   */
  async mLink (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mLink(devices, bulkData, this.decoders, { strict, options:  { ...request.input.args } });
  }

  /**
   * Unlink a device from an asset.
   */
   async unlink (request: KuzzleRequest) {
    const deviceId = request.getId();

    const document: DeviceBulkContent = { deviceId };
    const devices = await this.mGetDevice([document]);

    await this.deviceService.mUnlink(devices, { strict: true, options:  { ...request.input.args } });
  }

  /**
   * Unlink multiple device from multiple assets.
   */
  async mUnlink (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mUnlink(devices, { strict, options:  { ...request.input.args } });
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
    return result.successes.map((document: any) => new Device(document._source, document._id));
  }

  private async mParseRequest (request: KuzzleRequest) {
    const body = request.input.body;

    let bulkData: DeviceBulkContent[];

    if (body.csv) {
      const lines = await csv({ delimiter: 'auto' })
        .fromString(body.csv);

      bulkData = lines.map(line => ({ tenantId: line.tenantId, deviceId: line.deviceId, assetId: line.assetId }));
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
