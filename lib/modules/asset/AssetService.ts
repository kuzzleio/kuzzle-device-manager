import _ from "lodash";
import {
  BadRequestError,
  BatchController,
  JSONObject,
  KDocument,
  KHit,
  Mutex,
  NotFoundError,
  Plugin,
  PluginContext,
  SearchResult,
} from "kuzzle";

import { writeToDatabase } from "../../utils";
import { InternalCollection } from "../../InternalCollection";
import { mResponse, mRequest } from "../../utils/writeMany";
import { MeasureContent } from "../measure/";
import { DeviceManagerConfiguration } from "../engine";

import { Asset } from "./Asset";
import { AssetContent } from "./types/AssetContent";
import { EventAssetUpdateBefore } from "./types/AssetEvents";
import { AssetSerializer } from "./AssetSerializer";
import { DeviceUnlinkAssetRequest } from "../device/types/DeviceRequests";

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

    const assetDocuments = assets.map((asset: AssetContent) => {
      const _asset = new Asset(asset);

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

  private async lock<TReturn>(engineId: string, assetId: string, cb: () => Promise<TReturn>) {
    const mutex = new Mutex(`asset-${engineId}-${assetId}`);

    try {
      await mutex.lock();

      return await cb();
    }
    finally {
      await mutex.unlock();
    }
  }

  public async get(engineId: string, assetId: string): Promise<Asset> {
    const document = await this.sdk.document.get<AssetContent>(
      engineId,
      InternalCollection.ASSETS,
      assetId
    );

    return new Asset(document._source, document._id);
  }

  public async update(engineId: string, assetId: string, metadata: JSONObject, { refresh }: { refresh: any }): Promise<Asset> {
    return this.lock<Asset>(engineId, assetId, async () => {
      const asset = await this.get(engineId, assetId);

      // @todo add type EventAssetUpdateBefore
      const updatedPayload = await global.app.trigger(
        "device-manager:asset:update:before",
        { asset, metadata }
      );

      const { _source, _id } = await this.sdk.document.update<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        assetId,
        { metadata: updatedPayload.metadata },
        { refresh },
      );

      const updatedAsset = new Asset(_source, _id);

      // @todo add type EventAssetUpdateBefore
      await global.app.trigger(
        "device-manager:asset:update:after",
        { asset: updatedAsset, metadata: updatedPayload.metadata }
      );

      return updatedAsset;
    });
  }

  public async create(
    engineId: string,
    model: string,
    reference: string,
    metadata: JSONObject,
    { refresh }: { refresh: any },
  ): Promise<Asset> {
    const assetId = AssetSerializer.id(model, reference);

    return this.lock<Asset>(engineId, assetId, async () => {
      const { _source, _id } = await this.sdk.document.create<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        {
          model,
          reference,
          metadata,
        },
        assetId,
        { refresh });

      return new Asset(_source, _id);
    });
  }

  public async delete (
    engineId: string,
    assetId: string,
    { refresh, strict }: { refresh: any, strict: boolean },
  ) {
    return this.lock<void>(engineId, assetId, async () => {
      const asset = await this.get(engineId, assetId);

      if (strict && asset._source.deviceLinks.length !== 0) {
        throw new BadRequestError(`Asset "${assetId}" is still linked to devices.`);
      }

      for (const { deviceId } of asset._source.deviceLinks) {
        const req: DeviceUnlinkAssetRequest = {
          controller: "device-manager/devices",
          action: "update",
          engineId,
          _id: deviceId,
        };

        await this.sdk.query(req);
      }

      await this.sdk.document.delete(engineId, InternalCollection.ASSETS, assetId, {
        refresh,
      });
    });
  }

  public async search (
    engineId: string,
    searchBody: JSONObject,
    { from, size, scroll, lang }: { from?: number, size?: number, scroll?: string, lang?: string },
  ): Promise<SearchResult<KHit<AssetContent>>> {
    const result = await this.sdk.document.search<AssetContent>(
      engineId,
      InternalCollection.ASSETS,
      searchBody,
      { from, size, scroll, lang });

    return result;
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
