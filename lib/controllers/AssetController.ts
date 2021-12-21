import csv from 'csvtojson';

import {
  KuzzleRequest,
  EmbeddedSDK,
  Plugin,
} from 'kuzzle';


import { CRUDController } from './CRUDController';
import { BaseAsset } from '../models/BaseAsset';
import { AssetContentBase } from '../types';
import { AssetService } from '../core-classes';

export class AssetController extends CRUDController {
  private assetService: AssetService;
  
  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor (plugin: Plugin, assetService: AssetService) {
    super(plugin, 'assets');

    this.assetService = assetService;

    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ verb: 'post', path: 'device-manager/:index/assets' }],
        },
        update: {
          handler: this.update.bind(this),
          http: [{ verb: 'put', path: 'device-manager/:index/assets/:_id' }],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/:index/assets/:_id' }],
        },
        search: {
          handler: this.search.bind(this),
          http: [
            { verb: 'post', path: 'device-manager/:index/assets/_search' },
            { verb: 'get', path: 'device-manager/:index/assets/_search' },
          ],
        },
        importAssets: {
          handler: this.importAssets.bind(this),
          http: [{ verb: 'post', path: 'device-manager/:index/assets/_import' }]
        }
      },
    };
  }

  async update (request: KuzzleRequest) {
    const id = request.getId();
    const index = request.getIndex();
    const body = request.getBody();
    const asset = await this.sdk.document.get(
      index,
      this.collection,
      id
    );

    const response = await global.app.trigger(
      'device-manager:asset:update:before', {
      asset,
      updates: body,
    });

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
      const assetContent: AssetContentBase = {
        type,
        model,
        reference,
      };

      const asset = new BaseAsset(assetContent);
      request.input.args._id = asset._id;
    }

    return await super.create(request);
  }

  async importAssets (request: KuzzleRequest) {
    const index = request.getIndex();
    const content = request.getBodyString('csv');

    const assets = await csv({ delimiter: 'auto' })
      .fromString(content);

    const results = await this.assetService.importAssets(
      index,
      assets,
      {
        strict: true,
        options: { ...request.input.args }
      });

    return results;
  }
}
