import {
  ControllerDefinition,
  KuzzleRequest,
  EmbeddedSDK,
  JSONObject,
  PluginContext,
  BadRequestError,
} from 'kuzzle';

import { CRUDController } from './CRUDController';
import { Decoder } from '../decoders/Decoder';
import { Sensor } from '../models/Sensor';

export class SensorController extends CRUDController {
  public definition: ControllerDefinition;
  private decoders: Map<string, Decoder>;

  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  /**
   * Constructor
   *
   * @param context
   */
  constructor (config: JSONObject, context: PluginContext, decoders: Map<string, Decoder>) {
    super(context, 'sensors');

    this.context = context;
    this.config = config;
    this.decoders = decoders;

    this.definition = {
      actions: {
        update: {
          handler: this.update.bind(this),
          http: [{ verb: 'put', path: 'device-manager/sensor/:_id' }]
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/sensor/:_id' }]
        },
        search: {
          handler: this.search.bind(this),
          http: [
            { verb: 'post', path: 'device-manager/sensor/_search' },
            { verb: 'get', path: 'device-manager/sensor/_search' }
          ]
        },
        assign: {
          handler: this.assign.bind(this),
          http: [{ verb: 'post', path: 'device-manager/sensor/_:id/_assign/:tenantId' }]
        },
        unassign: {
          handler: this.unassign.bind(this),
          http: [{ verb: 'post', path: 'device-manager/sensor/:_id/_unassign' }]
        },
        link: {
          handler: this.link.bind(this),
          http: [{ verb: 'post', path: 'device-manager/sensor/_:id/_link/:assetId' }]
        },
        unlink: {
          handler: this.unlink.bind(this),
          http: [{ verb: 'post', path: 'device-manager/sensor/:_id/_unlink' }]
        },
      }
    };
  }

  /**
   * Assign a sensor to a tenant
   */
  async assign (request: KuzzleRequest) {
    const tenantId = this.getString(request, 'tenantId');
    const sensorId = this.getId(request);

    const sensor = await this.getSensor(sensorId);

    if (sensor._source.tenantId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is already assigned to a tenant`);
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
   * Unassign a sensor from it's tenant
   */
  async unassign (request: KuzzleRequest) {
    const sensorId = this.getId(request);

    const sensor = await this.getSensor(sensorId);

    if (! sensor._source.tenantId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is not assigned to a tenant`);
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
  async link (request: KuzzleRequest) {
    const assetId = this.getString(request, 'assetId');
    const sensorId = this.getId(request);

    const sensor = await this.getSensor(sensorId);

    if (! sensor._source.tenantId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is not assigned to a tenant`);
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

    await this.sdk.document.update(
      sensor._source.tenantId,
      'assets',
      assetId,
      { measures: assetMeasures });
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

    await this.sdk.document.delete(
      sensor._source.tenantId,
      'sensors',
      sensor._id);

    await this.sdk.document.update(
      sensor._source.tenantId,
      'assets',
      sensor._source.assetId,
      { measures: null });
  }

  private async getSensor (sensorId: string): Promise<Sensor> {
    const document: any = await this.sdk.document.get(
      this.config.adminIndex,
      'sensors',
      sensorId);

    return new Sensor(document._source, document._id);
  }
}