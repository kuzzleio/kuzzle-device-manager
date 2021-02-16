import {
  KuzzleRequest,
  EmbeddedSDK,
  JSONObject,
  PluginContext,
  BadRequestError,
} from 'kuzzle';

import { CRUDController } from './CRUDController';
import { Decoder } from '../decoders';
import { Sensor } from '../models';
import { SensorContent } from '../types';

export class SensorController extends CRUDController {
  private decoders: Map<string, Decoder>;

  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor (config: JSONObject, context: PluginContext, decoders: Map<string, Decoder>) {
    super(config, context, 'sensors');

    this.decoders = decoders;

    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ verb: 'post', path: 'device-manager/:index/sensors' }]
        },
        update: {
          handler: this.update.bind(this),
          http: [{ verb: 'put', path: 'device-manager/:index/sensors/:_id' }]
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/:index/sensors/:_id' }]
        },
        search: {
          handler: this.search.bind(this),
          http: [
            { verb: 'post', path: 'device-manager/:index/sensors/_search' },
            { verb: 'get', path: 'device-manager/:index/sensors/_search' }
          ]
        },
        attachTenant: {
          handler: this.attachTenant.bind(this),
          http: [{ verb: 'put', path: 'device-manager/:index/sensors/:_id/_attach' }]
        },
        detach: {
          handler: this.detach.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/sensors/:_id/_detach' }]
        },
        linkAsset: {
          handler: this.linkAsset.bind(this),
          http: [{ verb: 'put', path: 'device-manager/:index/sensors/:_id/_link/:assetId' }]
        },
        unlink: {
          handler: this.unlink.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/:index/sensors/:_id/_unlink' }]
        },
      }
    };
  }

  async create (request: KuzzleRequest) {
    const model = this.getBodyString(request, 'model');
    const reference = this.getBodyString(request, 'reference');
    const index = this.getString(request, 'index');

    const sensorContent: SensorContent = {
      measures: {},
      ...request.input.body,
      ...{
        model,
        reference,
        tenantId: index,
      },
    };

    const sensor = new Sensor(sensorContent);

    if (! request.input.resource._id) {
      request.input.resource._id = sensor._id;
    }

    await this.sdk.document.create(
      'device-manager',
      'sensors',
      sensor._source,
      sensor._id,
      { refresh: request.input.args.refresh });

    return super.create(request);
  }

  /**
   * Attach a sensor to a tenant
   */
  async attachTenant (request: KuzzleRequest) {
    const tenantId = this.getIndex(request);
    const sensorId = this.getId(request);

    const sensor = await this.getSensor(sensorId);

    if (sensor._source.tenantId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is already attached to a tenant`);
    }

    const { result: tenantExists } = await this.sdk.query({
      controller: 'device-manager/engine',
      action: 'exists',
      index: tenantId,
    });

    if (! tenantExists) {
      throw new BadRequestError(`Tenant "${tenantId}" does not have a device-manager engine`);
    }

    sensor._source.tenantId = tenantId;

    await this.sdk.document.update(
      this.config.adminIndex,
      'sensors',
      sensor._id,
      sensor._source);

    await this.sdk.document.create(
      tenantId,
      'sensors',
      sensor._source,
      sensor._id);
  }

  /**
   * Unattach a sensor from it's tenant
   */
  async detach (request: KuzzleRequest) {
    const sensorId = this.getId(request);

    const sensor = await this.getSensor(sensorId);

    if (! sensor._source.tenantId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is not attached to a tenant`);
    }

    if (sensor._source.assetId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is still linked to an asset`);
    }

    await this.sdk.document.delete(
      sensor._source.tenantId,
      'sensors',
      sensor._id);

    await this.sdk.document.update(
      this.config.adminIndex,
      'sensors',
      sensor._id,
      { tenantId: null });
  }

  /**
   * Link a sensor to an asset.
   */
  async linkAsset (request: KuzzleRequest) {
    const assetId = this.getString(request, 'assetId');
    const sensorId = this.getId(request);

    const sensor = await this.getSensor(sensorId);

    if (! sensor._source.tenantId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is not attached to a tenant`);
    }

    const assetExists = await this.sdk.document.exists(
      sensor._source.tenantId,
      'assets',
      assetId);

    if (! assetExists) {
      throw new BadRequestError(`Asset "${assetId}" does not exists`);
    }

    await this.sdk.document.update(
      this.config.adminIndex,
      'sensors',
      sensor._id,
      { assetId });

    await this.sdk.document.update(
      sensor._source.tenantId,
      'sensors',
      sensor._id,
      { assetId });

    const decoder = this.decoders.get(sensor._source.model);

    const assetMeasures = await decoder.copyToAsset(sensor);

    const updatedAsset = await this.sdk.document.update(
      sensor._source.tenantId,
      'assets',
      assetId,
      { measures: assetMeasures },
      { source: true });

    // Historize
    await this.sdk.document.create(
      sensor._source.tenantId,
      'assets-history',
      updatedAsset._source,
      `${updatedAsset._id}_${request.id}`);
  }

  /**
   * Unlink a sensor from an asset.
   */
  async unlink (request: KuzzleRequest) {
    const sensorId = this.getId(request);

    const sensor = await this.getSensor(sensorId);

    if (! sensor._source.assetId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is not linked to an asset`);
    }

    await this.sdk.document.update(
      this.config.adminIndex,
      'sensors',
      sensor._id,
      { assetId: null });

    // @todo remove only the unlinked sensor measures:
    // each sensors must declare what kind of measure it's going to copy
    const updatedAsset = await this.sdk.document.update(
      sensor._source.tenantId,
      'assets',
      sensor._source.assetId,
      { measures: null });

    // Historize
    await this.sdk.document.create(
      sensor._source.tenantId,
      'assets-history',
      updatedAsset._source,
      `${updatedAsset._id}_${request.id}`);
  }

  private async getSensor (sensorId: string): Promise<Sensor> {
    const document: any = await this.sdk.document.get(
      this.config.adminIndex,
      'sensors',
      sensorId);

    return new Sensor(document._source, document._id);
  }
}
