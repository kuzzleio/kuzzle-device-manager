import _ from 'lodash';
import {
  PluginContext,
  Plugin,
  JSONObject,
  KDocument,
  BadRequestError,
  BatchController 
} from 'kuzzle';

import { InternalCollection } from '../InternalCollection';
import { mRequest, mResponse, writeToDatabase } from '../utils/writeMany';
import { BaseAsset } from '../models/BaseAsset';
import {
  BaseAssetContent,
  DeviceManagerConfiguration,
  LinkedMeasureName,
  MeasureContent
} from '../types';

export class AssetService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private batch: BatchController;

  private get sdk () {
    return this.context.accessors.sdk;
  }

  constructor (plugin: Plugin, batchController: BatchController) {
    this.config = plugin.config as any;
    this.context = plugin.context;

    this.batch = batchController;
  }

  /**
   * Updates an asset with the new measures
   *
   * @returns Updated asset
   */
  public async updateMeasures (
    engineId: string,
    asset: BaseAsset,
    newMeasures: MeasureContent[],
    measuresNames?: LinkedMeasureName[],
  ): Promise<BaseAsset> {
    // dup array reference
    const measureNameMap = new Map<string, string>();

    if (measuresNames) {
      for (const measureName of measuresNames) {
        measureNameMap.set(measureName.type, measureName.name);
      }
    }

    const measures = newMeasures.map(m => m);
    for (const measure of measures) {
      if (measureNameMap.has(measure.type)) {
        measure.name = measureNameMap.get(measure.type);
      }
    }

    // Keep previous measures that were not updated
    // array are updated in place so we need to keep previous elements
    for (const previousMeasure of asset._source.measures) {
      if (! measures.find(m => m.name === previousMeasure.name)) {
        measures.push(previousMeasure);
      }
    }

    asset._source.measures = measures;

    // Give the list of new measures types in event payload
    const result = await global.app.trigger(
      `engine:${engineId}:asset:measures:new`,
      { asset, measures: newMeasures });

    const assetDocument = await this.batch.update<BaseAssetContent>(
      engineId,
      InternalCollection.ASSETS,
      asset._id,
      result.asset._source,
      { retryOnConflict: 10, source: true });

    return new BaseAsset(assetDocument._source as any, assetDocument._id);
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

  public async getAsset (
    engineId: string,
    assetId: string
  ): Promise<BaseAsset> {
    const document = await this.sdk.document.get<BaseAssetContent>(
      engineId,
      InternalCollection.ASSETS,
      assetId);

    return new BaseAsset(document._source, document._id);
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
