import _ from "lodash";
import {
  BadRequestError,
  BatchController,
  JSONObject,
  KDocument,
  NotFoundError,
  Plugin,
  PluginContext,
} from "kuzzle";
import { writeToDatabase } from 'lib/utils';

import { InternalCollection } from '../../InternalCollection';
import { mResponse, mRequest } from '../../utils/writeMany';
import { MeasureContent } from '../measure/';
import { DeviceManagerConfiguration } from '../engine';

import { BaseAsset } from './BaseAsset';
import { BaseAssetContent } from './types/BaseAssetContent';

export class AssetService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private batch: BatchController;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  constructor(plugin: Plugin, batchController: BatchController) {
    this.config = plugin.config as any;
    this.context = plugin.context;

    this.batch = batchController;
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
  async measureHistory(
    engineId: string,
    assetId: string,
    {
      size = 25,
      startAt,
      endAt,
    }: { size?: number; startAt?: string; endAt?: string }
  ): Promise<KDocument<MeasureContent>[]> {
    await this.get(engineId, assetId);

    const query = {
      range: {
        measuredAt: {
          gte: 0,
          lte: Number.MAX_SAFE_INTEGER,
        },
      },
    };

    if (startAt) {
      query.range.measuredAt.gte = this.iso8601(startAt, "startAt").getTime();
    }

    if (endAt) {
      query.range.measuredAt.lte = this.iso8601(startAt, "endAt").getTime();
    }

    const sort = { measuredAt: "desc" };

    const measures = await this.sdk.document.search<MeasureContent>(
      engineId,
      "measures",
      { query, sort },
      { size: size || 25 }
    );

    return measures.hits;
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
        body: _.omit(asset, ["_id"]),
      };
    });

    await writeToDatabase(
      assetDocuments,
      async (result: mRequest[]): Promise<mResponse> => {
        const created = await this.sdk.document.mCreate(
          index,
          "assets",
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

  public async get(engineId: string, assetId: string): Promise<BaseAsset> {
    const document = await this.sdk.document.get<BaseAssetContent>(
      engineId,
      InternalCollection.ASSETS,
      assetId
    );

    return new BaseAsset(document._source, document._id);
  }

  public async removeMeasures(
    engineId: string,
    assetId: string,
    assetMeasureNames: string[],
    { strict }: { strict?: boolean }
  ) {
    const asset = await this.get(engineId, assetId);
    const result = asset.removeMeasures(assetMeasureNames);

    if (strict && result.notFound.length) {
      throw new NotFoundError(
        `AssetMeasureNames "${result.notFound}" in asset "${assetId}" of engine "${engineId}"`
      );
    }

    await this.sdk.document.update(
      engineId,
      InternalCollection.ASSETS,
      asset._id,
      asset._source,
      { strict }
    );

    return {
      asset,
      ...result,
    };
  }

  // @todo remove when we have the date extractor in the core
  private iso8601(value: string, name: string): Date {
    const parsed: any = new Date(value);

    if (isNaN(parsed)) {
      throw new BadRequestError(`"${name}" is not a valid ISO8601 date`);
    }

    return parsed;
  }
}
