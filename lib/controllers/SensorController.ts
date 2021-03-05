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
import { Sensor } from '../models';
import { SensorContent, SensorBulkContent } from '../types';
import { SensorService } from 'lib/services';

export class SensorController extends CRUDController {
  private decoders: Map<string, Decoder>;

  get sdk(): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor(config: JSONObject, context: PluginContext, decoders: Map<string, Decoder>, sensorService: SensorService) {
    super(config, context, 'sensors');

    this.decoders = decoders;

    this.sensorService = sensorService;

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
        mAttachTenant: {
          handler: this.mAttachTenant.bind(this),
          http: [{ verb: 'put', path: 'device-manager/sensors/_mAttach' }]
        },
        detach: {
          handler: this.detach.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/sensors/:_id/_detach' }]
        },
        mDetach: {
          handler: this.mDetach.bind(this),
          http: [{ verb: 'put', path: 'device-manager/sensors/_mDetach' }]
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

    const document = { tenant: tenantId, id: sensorId };
    const sensors = await this.mGetSensor([document]);

    await this.sensorService.mAttachTenant(sensors, [document], true);
  }

  /**
   * Attach multiple sensors to multiple tenants
   */
  async mAttachTenant (request: KuzzleRequest) {
    const { bulkData, isStrict } = await this.mParseRequest(request);

    const sensors = await this.mGetSensor(bulkData);

    return this.sensorService.mAttachTenant(sensors, bulkData, isStrict);
  }



  /**
   * Unattach a sensor from it's tenant
   */
  async detach (request: KuzzleRequest) {
    const sensorId = this.getId(request);

    const document: SensorBulkContent = { id: sensorId };
    const sensors = await this.mGetSensor([document]);

    // Request does not take tenant index as an input
    document.tenant = sensors[0]._source.tenantId;

    await this.sensorService.mDetach(sensors, [document], true);
  }
  
  /**
   * Unattach multiple sensors from multiple tenants
   */
  async mDetach (request: KuzzleRequest) {
    const { bulkData, isStrict } = await this.mParseRequest(request);

    const sensors = await this.mGetSensor(bulkData);

    return this.sensorService.mDetach(sensors, bulkData, isStrict);
  }

  /**
   * Link a sensor to an asset.
   */
  async linkAsset(request: KuzzleRequest) {
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

  private async mGetSensor (documents: SensorBulkContent[]): Promise<Sensor[]> {
    const sensorIds = documents.map(doc => doc.id);
    const result: any = await this.sdk.document.mGet(
      this.config.adminIndex,
      'sensors',
      sensorIds
    )
    return result.successes.map((document: any) => new Sensor(document._source, document._id));
  }

  private async mParseRequest (request: KuzzleRequest) {
    const { body } = request.input;
    let bulkData: SensorBulkContent[];

    if (body.csv) {
      const lines = await csv({ delimiter: 'auto' })
        .fromString(body.csv);

      bulkData = lines.map(line => ({ tenant: line.tenant, id: line.id }));
    }
    else if (body.records) {
      bulkData = body.records;
    }
    else {
      throw new BadRequestError(`Malformed request missing property csv or records`);
    }

    const isStrict = body.strict || false;

    return { isStrict, bulkData };
  }
}
