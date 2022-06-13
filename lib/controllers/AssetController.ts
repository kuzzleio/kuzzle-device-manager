import csv from 'csvtojson';
import { BadRequestError, KuzzleRequest, Plugin } from 'kuzzle';
import { CRUDController } from 'kuzzle-plugin-commons';
import { MeasureService } from 'lib/core-classes/MeasureService';
import { AssetService, DeviceService } from '../core-classes';
import { BaseAsset } from '../models/BaseAsset';

export class AssetController extends CRUDController {
  private assetService: AssetService;
  private deviceService: DeviceService;
  private measureService: MeasureService;

  constructor (
    plugin: Plugin,
    assetService: AssetService,
    deviceService: DeviceService,
    measureService: MeasureService
  ) {
    super(plugin, 'assets');

    this.assetService = assetService;
    this.deviceService = deviceService;
    this.measureService = measureService;

    /* eslint-disable sort-keys */
    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ path: 'device-manager/:engineId/assets', verb: 'post' }],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ path: 'device-manager/:engineId/assets/:_id', verb: 'delete' }],
        },
        importAssets: {
          handler: this.importAssets.bind(this),
          http: [{ path: 'device-manager/:engineId/assets/_import', verb: 'post' }]
        },
        search: {
          handler: this.search.bind(this),
          http: [
            { path: 'device-manager/:engineId/assets/_search', verb: 'post' },
            { path: 'device-manager/:engineId/assets/_search', verb: 'get' },
          ],
        },
        update: {
          handler: this.update.bind(this),
          http: [{ path: 'device-manager/:engineId/assets/:_id', verb: 'put' }],
        },
        getMeasures: {
          handler: this.getMeasures.bind(this),
          http: [{ path: 'device-manager/:engineId/assets/:_id/measures', verb: 'get' }],
        },
        pushMeasures: {
          handler: this.pushMeasures.bind(this),
          http: [{ path: 'device-manager/:engineId/assets/:_id/measures', verb: 'post' }],
        }
      },
    };
    /* eslint-enable sort-keys */
  }

  async getMeasures (request: KuzzleRequest) {
    const id = request.getId();
    const engineId = request.getString('engineId');
    const size = request.input.args.size;
    const startAt = request.input.args.startAt;
    const endAt = request.input.args.endAt;

    if (size && startAt || size && endAt) {
      throw new BadRequestError('You cannot specify both a "size" and a "startAt" or "endAt"');
    }

    const measures = await this.assetService.measureHistory(
      engineId,
      id,
      { endAt, size, startAt });

    return { measures };
  }

  async pushMeasures (request: KuzzleRequest) {
    const engineId = request.getString('engineId');
    const assetId = request.getId();
    const refresh = request.getRefresh();
    const strict = request.getBoolean('strict');
    const measures = request.getBodyArray('measures');

    const { asset, errors } = await this.measureService.registerByAsset(
      engineId,
      assetId,
      measures,
      refresh,
      strict);

    return { asset, engineId, errors };
  }

  async update (request: KuzzleRequest) {
    const id = request.getId();
    const engineId = request.getString('engineId');
    const body = request.getBody();
    const asset = await this.sdk.document.get(engineId, this.collection, id);

    const response = await global.app.trigger(
      'device-manager:asset:update:before', {
        asset,
        updates: body });

    request.input.args.index = engineId;
    request.input.body = response.updates;

    const result = await super.update(request);

    await global.app.trigger('device-manager:asset:update:after', {
      asset,
      updates: result._source,
    });

    return result;
  }

  async create (request: KuzzleRequest) {
    const type = request.getBodyString('type');
    const model = request.getBodyString('model');
    const reference = request.getBodyString('reference');

    if (! request.input.args._id) {
      request.input.args._id = BaseAsset.id(type, model, reference);
    }

    request.input.args.index = request.getString('engineId');
    request.input.body.measures = [];
    request.input.body.deviceLinks = [];

    request.input.body.measures = [];

    return super.create(request);
  }

  async importAssets (request: KuzzleRequest) {
    const engineId = request.getString('engineId');
    const content = request.getBodyString('csv');

    const assets = await csv({ delimiter: 'auto' }).fromString(content);

    const results = await this.assetService.importAssets(
      engineId,
      assets,
      {
        options: { ...request.input.args },
        strict: true
      });

    return results;
  }

  async delete (request: KuzzleRequest) {
    const engineId = request.getString('engineId');
    request.input.args.index = engineId;
    const assetId = request.getId();
    const refresh = request.getRefresh();
    const strict = request.getBoolean('strict');
    const devicesLinks = await this.assetService.getAsset(engineId, assetId);

    if (Array.isArray(devicesLinks._source.deviceLinks)) {
      for (const deviceLink of devicesLinks._source.deviceLinks) {
        await this.deviceService.unlinkAsset(deviceLink.deviceId, { refresh, strict });
      }
    }
    return super.delete(request);
  }
}
