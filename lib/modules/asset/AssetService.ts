import {
  Backend,
  BadRequestError,
  JSONObject,
  KDocument,
  KHit,
  PluginContext,
  SearchResult,
} from "kuzzle";

import { MeasureContent } from "../measure/";

import { Asset } from "./model/Asset";
import { AssetContent } from "./types/AssetContent";
import { AssetSerializer } from "./model/AssetSerializer";
import { ApiDeviceUnlinkAssetRequest } from "../device/types/DeviceApi";
import { lock } from "../shared/utils/lock";
import {
  EventAssetUpdateAfter,
  EventAssetUpdateBefore,
} from "./types/AssetEvents";
import { Metadata } from "../shared";
import { AssetModelContent } from "../model";
import {
  DeviceManagerConfiguration,
  InternalCollection,
  DeviceManagerPlugin,
} from "../../core";
import { EngineContent } from "kuzzle-plugin-commons/lib/engine/EngineContent";

export class AssetService {
  private context: PluginContext;
  private config: DeviceManagerConfiguration;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  private get app(): Backend {
    return global.app;
  }

  constructor(plugin: DeviceManagerPlugin) {
    this.context = plugin.context;
    this.config = plugin.config;
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
  async getMeasureHistory(
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
    metadata: Metadata,
    { refresh }: { refresh: any }
  ): Promise<Asset> {
    return lock(`asset:${engineId}:${assetId}`, async () => {
      const asset = await this.get(engineId, assetId);

      const updatedPayload = await this.app.trigger<EventAssetUpdateBefore>(
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

      await this.app.trigger<EventAssetUpdateAfter>(
        "device-manager:asset:update:after",
        {
          asset: updatedAsset,
          metadata: updatedPayload.metadata,
        }
      );

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

    return lock(`asset:${engineId}:${assetId}`, async () => {
      const assetModel = await this.getModel(engineId, model);

      const assetMetadata = {};
      for (const metadataName of Object.keys(
        assetModel.asset.metadataMappings
      )) {
        assetMetadata[metadataName] = null;
      }

      const { _source, _id } = await this.sdk.document.create<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        {
          metadata: { ...assetMetadata, ...metadata },
          model,
          reference,
        },
        assetId,
        { refresh }
      );

      return new Asset(_source, _id);
    });
  }

  private async getModel(
    engineId: string,
    model: string
  ): Promise<AssetModelContent> {
    const engine = await this.getEngine(engineId);

    const query = {
      and: [
        { equals: { engineGroup: engine.group } },
        { equals: { type: "asset" } },
        { equals: { "asset.model": model } },
      ],
    };

    const result = await this.sdk.document.search<AssetModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 1 }
    );

    if (result.total === 0) {
      throw new BadRequestError(`Unknown Asset model "${model}".`);
    }

    return result.hits[0]._source;
  }

  private async getEngine(engineId: string): Promise<EngineContent> {
    const engine = await this.sdk.document.get(
      this.config.adminIndex,
      InternalCollection.CONFIG,
      `engine-device-manager--${engineId}`
    );

    return engine._source.engine;
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
          _id: deviceId,
          action: "unlinkAsset",
          controller: "device-manager/devices",
          engineId,
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
      { from, lang, scroll, size }
    );

    return result;
  }
}
