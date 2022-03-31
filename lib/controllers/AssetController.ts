import csv from 'csvtojson';
import { CRUDController } from 'kuzzle-plugin-commons';
import {
  KuzzleRequest,
  Plugin,
} from 'kuzzle';

import { BaseAsset } from '../models/BaseAsset';
import { BaseAssetContent } from '../types';
import { AssetService } from '../core-classes';

export class AssetController extends CRUDController {
  private assetService: AssetService;

  private get sdk () {
    return this.context.accessors.sdk;
  }

  constructor (plugin: Plugin, assetService: AssetService) {
    super(plugin, 'assets');

    this.assetService = assetService;

    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ path: 'device-manager/:index/assets', verb: 'post' }],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ path: 'device-manager/:index/assets/:_id', verb: 'delete' }],
        },
        importAssets: {
          handler: this.importAssets.bind(this),
          http: [{ path: 'device-manager/:index/assets/_import', verb: 'post' }]
        },
        search: {
          handler: this.search.bind(this),
          http: [
            { path: 'device-manager/:index/assets/_search', verb: 'post' },
            { path: 'device-manager/:index/assets/_search', verb: 'get' },
          ],
        },
        update: {
          handler: this.update.bind(this),
          http: [{ path: 'device-manager/:index/assets/:_id', verb: 'put' }],
        }
      },
    };
  }

  async update (request: KuzzleRequest) {
    const id = request.getId();
    const index = request.getIndex();
    const body = request.getBody();
    const asset = await this.sdk.document.get(index, this.collection, id);

    const response = await global.app.trigger(
      'device-manager:asset:update:before', {
        asset,
        updates: body});

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

    return super.create(request);
  }

  async importAssets (request: KuzzleRequest) {
    const index = request.getIndex();
    const content = request.getBodyString('csv');

    const assets = await csv({ delimiter: 'auto' }).fromString(content);

    const results = await this.assetService.importAssets(
      index,
      assets,
      {
        options: { ...request.input.args },
        strict: true
      });

    return results;
  }
}
