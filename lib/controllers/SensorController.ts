import {
  KuzzleRequest,
  EmbeddedSDK,
  JSONObject,
  PluginContext,
} from 'kuzzle';

import { CRUDController } from './CRUDController';
import { Decoder } from '../decoders';
import { Sensor } from '../models';
import { SensorContent } from '../types';
import { SensorService } from 'lib/services/SensorService';

export class SensorController extends CRUDController {
  private decoders: Map<string, Decoder>;
  private sensorService: SensorService

  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor (config: JSONObject, context: PluginContext, decoders: Map<string, Decoder>) {
    super(config, context, 'sensors');

    this.decoders = decoders;

    this.sensorService = new SensorService(this.config, context);

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
          http: [{ verb: 'put', path: 'device-manager/:index/sensors/_:id/_attach' }]
        },
        detach: {
          handler: this.detach.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/sensors/:_id/_detach' }]
        },
        linkAsset: {
          handler: this.linkAsset.bind(this),
          http: [{ verb: 'put', path: 'device-manager/:index/sensors/_:id/_link/:assetId' }]
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

    if (! request.input.resource._id) {
      const sensorContent: SensorContent = {
        model,
        reference,
        measures: {}
      };

      const sensor = new Sensor(sensorContent);
      request.input.resource._id = sensor._id;
    }

    return super.create(request);
  }

  /**
   * Attach a sensor to a tenant
   */
  async attachTenant (request: KuzzleRequest) {
    const tenantId = this.getIndex(request);
    const sensorId = this.getId(request);

    const sensor = await this.getSensor(sensorId);

    await this.sensorService.attachTenant(sensor, tenantId);
  }

  /**
   * Unattach a sensor from it's tenant
   */
  async detach (request: KuzzleRequest) {
    const sensorId = this.getId(request);

    const sensor = await this.getSensor(sensorId);

    await this.sensorService.detach(sensor);
  }

  /**
   * Link a sensor to an asset.
   */
  async linkAsset (request: KuzzleRequest) {
    const assetId = this.getString(request, 'assetId');
    const sensorId = this.getId(request);

    const sensor = await this.getSensor(sensorId);

    await this.sensorService.linkAsset(sensor, assetId, this.decoders);
  }

  /**
   * Unlink a sensor from an asset.
   */
  async unlink (request: KuzzleRequest) {
    const sensorId = this.getId(request);

    const sensor = await this.getSensor(sensorId);

    this.sensorService.unlink(sensor);
  }

  private async getSensor (sensorId: string): Promise<Sensor> {
    const document: any = await this.sdk.document.get(
      this.config.adminIndex,
      'sensors',
      sensorId);

    return new Sensor(document._source, document._id);
  }
}
