import {
  KuzzleRequest,
  JSONObject,
  PluginContext,
  EmbeddedSDK,
} from 'kuzzle';

import { CRUDController } from './CRUDController';
import { BaseAsset } from '../models/BaseAsset';
import { BaseAssetContent } from '../types';

export class AssetController extends CRUDController {
  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor (config: JSONObject, context: PluginContext) {
    super(config, context, 'assets');

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
      },
    };
  }

  async create (request: KuzzleRequest) {
    const type = request.getBodyString('type');
    const model = request.getBodyString('model');
    const reference = request.getBodyString('reference');

    if (! request.input.resource._id) {
      const assetContent: BaseAssetContent = {
        type,
        model,
        reference,
      };

      const asset = new BaseAsset(assetContent);
      request.input.resource._id = asset._id;
    }

    return await super.create(request);
  }
}
