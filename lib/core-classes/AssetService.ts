import _ from 'lodash';

import { PluginContext, EmbeddedSDK, Plugin, JSONObject } from 'kuzzle';

import { DeviceManagerConfig } from '../DeviceManagerPlugin';
import { mRequest, mResponse, writeToDatabase } from '../utils/writeMany';
import { BaseAsset } from '../models/BaseAsset';
import { BaseAssetContent } from '../types';

export class AssetService {
  private config: DeviceManagerConfig;
  private context: PluginContext;

  get sdk(): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor(plugin: Plugin) {
    this.config = plugin.config as any;
    this.context = plugin.context;
  }

  async importAssets(
    index: string,
    assets: JSONObject,
    { strict, options }: { strict?: boolean; options?: JSONObject }
  ) {
    const results = {
      errors: [],
      successes: [],
    };

    const assetDocuments = assets.map((asset: BaseAssetContent) => {
      const _asset = new BaseAsset(asset);

      return {
        _id: _asset._id,
        body: _.omit(asset, ['_id']),
      };
    });

    await writeToDatabase(
      assetDocuments,
      async (result: mRequest[]): Promise<mResponse> => {

        const created = await this.sdk.document.mCreate(
          index,
          'assets',
          result,
          { strict, ...options }
        );

        return {
          errors: results.errors.concat(created.errors),
          successes: results.successes.concat(created.successes),
        };
      }
    );

    return results;
  }
}
