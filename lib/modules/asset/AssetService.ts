import _ from "lodash";
import {
  BadRequestError,
  JSONObject,
  KDocument,
  KHit,
  NotFoundError,
  Plugin,
  PluginContext,
  SearchResult,
} from "kuzzle";

import { InternalCollection } from "../../core/InternalCollection";
import { MeasureContent } from "../measure/";

import { Asset } from "./model/Asset";
import { AssetContent } from "./types/AssetContent";
import { AssetSerializer } from "./model/AssetSerializer";
import { ApiDeviceUnlinkAssetRequest } from "../device/types/DeviceApi";
import { lock } from "../shared/utils/lock";

export class AssetService {
  private context: PluginContext;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  constructor(plugin: Plugin) {
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
      query.range.measuredAt.gte = new Date(startAt).getTime();
    }

    if (endAt) {
      query.range.measuredAt.lte = new Date(endAt).getTime();
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

  public async get(engineId: string, assetId: string): Promise<Asset> {
    const document = await this.sdk.document.get<AssetContent>(
      engineId,
      InternalCollection.ASSETS,
      assetId
    );

    return new Asset(document._source, document._id);
  }

  public async update(
    engineId: string,
    assetId: string,
    metadata: JSONObject,
    { refresh }: { refresh: any }
  ): Promise<Asset> {
    return lock<Asset>(`asset:${engineId}:${assetId}`, async () => {
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
        { refresh }
      );

      const updatedAsset = new Asset(_source, _id);

      // @todo add type EventAssetUpdateBefore
      await global.app.trigger("device-manager:asset:update:after", {
        asset: updatedAsset,
        metadata: updatedPayload.metadata,
      });

      return updatedAsset;
    });
  }

  public async create(
    engineId: string,
    model: string,
    reference: string,
    metadata: JSONObject,
    { refresh }: { refresh: any }
  ): Promise<Asset> {
    const assetId = AssetSerializer.id(model, reference);

    return lock<Asset>(`asset:${engineId}:${assetId}`, async () => {
      const { _source, _id } = await this.sdk.document.create<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        {
          model,
          reference,
          metadata,
        },
        assetId,
        { refresh }
      );

      return new Asset(_source, _id);
    });
  }

  public async delete(
    engineId: string,
    assetId: string,
    { refresh, strict }: { refresh: any; strict: boolean }
  ) {
    return lock<void>(`asset:${engineId}:${assetId}`, async () => {
      const asset = await this.get(engineId, assetId);

      if (strict && asset._source.deviceLinks.length !== 0) {
        throw new BadRequestError(
          `Asset "${assetId}" is still linked to devices.`
        );
      }

      for (const { deviceId } of asset._source.deviceLinks) {
        const req: ApiDeviceUnlinkAssetRequest = {
          controller: "device-manager/devices",
          action: "unlinkAsset",
          engineId,
          _id: deviceId,
        };

        await this.sdk.query(req);
      }

      await this.sdk.document.delete(
        engineId,
        InternalCollection.ASSETS,
        assetId,
        {
          refresh,
        }
      );
    });
  }

  public async search(
    engineId: string,
    searchBody: JSONObject,
    {
      from,
      size,
      scroll,
      lang,
    }: { from?: number; size?: number; scroll?: string; lang?: string }
  ): Promise<SearchResult<KHit<AssetContent>>> {
    const result = await this.sdk.document.search<AssetContent>(
      engineId,
      InternalCollection.ASSETS,
      searchBody,
      { from, size, scroll, lang }
    );

    return result;
  }
}
