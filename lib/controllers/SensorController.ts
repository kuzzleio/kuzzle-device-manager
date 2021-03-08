import {
  KuzzleRequest,
  EmbeddedSDK,
  JSONObject,
  PluginContext,
} from 'kuzzle';

import { CRUDController } from './CRUDController';
import { Decoder } from '../decoders';
import { Sensor } from '../models';
import { SensorService } from 'lib/services';

export class SensorController extends CRUDController {
  private decoders: Map<string, Decoder>;

  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor (config: JSONObject, context: PluginContext, decoders: Map<string, Decoder>, sensorService: SensorService) {
    super(config, context, 'sensors');

    this.decoders = decoders;

    this.sensorService = sensorService;

    this.definition = {
      actions: {
        update: {
          handler: this.update.bind(this),
          http: [{ verb: 'put', path: 'device-manager/:index/sensors/:_id' }]
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

    await this.sensorService.unlink(sensor);
  }

  private async getSensor (sensorId: string): Promise<Sensor> {
    const document: any = await this.sdk.document.get(
      this.config.adminIndex,
      'sensors',
      sensorId);

    return new Sensor(document._source, document._id);
  }
}
