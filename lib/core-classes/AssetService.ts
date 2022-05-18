import _ from 'lodash';
import { PluginContext, Plugin, JSONObject, KDocument, BadRequestError } from 'kuzzle';

import { mRequest, mResponse, writeToDatabase } from '../utils/writeMany';
import { BaseAsset } from '../models/BaseAsset';
import { BaseAssetContent, DeviceManagerConfiguration, MeasureContent } from '../types';

export class AssetService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;

  private get sdk () {
    return this.context.accessors.sdk;
  }

  constructor (plugin: Plugin) {
    this.config = plugin.config as any;
    this.context = plugin.context;
  }

  /**
   * Returns measures history for an asset
   *
   * @param engineId Engine ID
   * @param assetId Asset ID
   * @param options.size Number of measures to return
   * @param options.startAt Returns measures starting from this date (ISO8601)
   * @param options.endAt Returns measures until this date (ISO8601)
   */
  async measureHistory (
    engineId: string,
    assetId: string,
    { size = 25, startAt, endAt }: { size?: number, startAt?: string, endAt?: string },
  ): Promise<KDocument<MeasureContent>[]> {
    await this.getAsset(engineId, assetId);

    const query = {
      range: {
        measuredAt: {
          gte: 0,
          lte: Number.MAX_SAFE_INTEGER,
        }
      }
    };

    if (startAt) {
      query.range.measuredAt.gte = this.iso8601(startAt, 'startAt').getTime();
    }

    if (endAt) {
      query.range.measuredAt.lte = this.iso8601(startAt, 'endAt').getTime();
    }

    const sort = { 'measuredAt': 'desc' };

    const measures = await this.sdk.document.search<MeasureContent>(
      engineId,
      'measures',
      { query, sort },
      { size: size || 25 });

    return measures.hits;
  }

  async importAssets (
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

  getAsset (engineId: string, assetId: string): Promise<KDocument<BaseAssetContent>> {
    return this.sdk.document.get<BaseAssetContent>(engineId, 'assets', assetId);
  }

  // @todo remove when we have the date extractor in the core
  private iso8601 (value: string, name: string): Date {
    const parsed: any = new Date(value);

    if (isNaN(parsed)) {
      throw new BadRequestError(`"${name}" is not a valid ISO8601 date`);
    }
    
    return parsed;
  }
}
