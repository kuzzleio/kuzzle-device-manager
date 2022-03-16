import _ from 'lodash';
import { PluginContext, Plugin, JSONObject } from 'kuzzle';

import { mRequest, mResponse, writeToDatabase } from '../utils/writeMany';
import { BaseAsset } from '../models/BaseAsset';
import { BaseAssetContent, DeviceManagerConfiguration } from '../types';

export class AssetService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;

  private get sdk () {
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
