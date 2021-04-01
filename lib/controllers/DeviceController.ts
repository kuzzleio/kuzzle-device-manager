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
      }
    };
  }

  /**
   * Attach a device to a tenant
   */
  async attachTenant (request: KuzzleRequest) {
    const tenantId = this.getIndex(request);
    const deviceId = this.getId(request);

    const document = { tenantId: tenantId, deviceId: deviceId };
    const devices = await this.mGetDevice([document]);

    await this.deviceService.mAttach(devices, [document], { strict: true });
  }

  /**
   * Attach multiple devices to multiple tenants
   */
  async mAttach (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mAttach(devices, bulkData, { strict });
  }

  /**
   * Unattach a device from it's tenant
   */
  async detach (request: KuzzleRequest) {
    const deviceId = this.getId(request);

    const document: DeviceBulkContent = { deviceId };
    const devices = await this.mGetDevice([document]);

    await this.deviceService.mDetach(devices, [document], { strict: true });
  }
  
  /**
   * Unattach multiple devices from multiple tenants
   */
  async mDetach (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mDetach(devices, bulkData, { strict });
  }

  /**
   * Link a device to an asset.
   */
  async linkAsset (request: KuzzleRequest) {
    const assetId = this.getString(request, 'assetId');
    const deviceId = this.getId(request);

    const document: DeviceBulkContent = { deviceId, assetId };
    const devices = await this.mGetDevice([document]);

    await this.deviceService.mLink(devices, [document], this.decoders, { strict: true });
  }

  /**
   * Link multiple devices to multiple assets.
   */
  async mLink (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mLink(devices, bulkData, this.decoders, { strict });
  }

  /**
   * Unlink a device from an asset.
   */
   async unlink (request: KuzzleRequest) {
    const deviceId = this.getId(request);

    const document: DeviceBulkContent = { deviceId };
    const devices = await this.mGetDevice([document]);

    await this.deviceService.mUnlink(devices, { strict: true });
  }

  /**
   * Unlink multiple device from multiple assets.
   */
  async mUnlink (request: KuzzleRequest) {
    const { bulkData, strict } = await this.mParseRequest(request);

    const devices = await this.mGetDevice(bulkData);

    return this.deviceService.mUnlink(devices, { strict });
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
    const { body, args } = request.input;

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

    const strict = args.strict ? args.strict : false;

    return { strict, bulkData };
  }
}
