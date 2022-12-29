import _ from "lodash";
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
import { ApiDeviceUnlinkAssetRequest } from "../device";
import { lock } from "../shared/utils/lock";
import { EmbeddedMeasure, Metadata } from "../shared";
import {
  DeviceManagerConfiguration,
  InternalCollection,
  DeviceManagerPlugin,
} from "../../core";
import { ask } from "../shared/utils/ask";
import { AskModelAssetGet } from "../model/types/ModelEvents";

import { AssetContent } from "./types/AssetContent";
import { AssetSerializer } from "./model/AssetSerializer";
import {
  EventAssetUpdateAfter,
  EventAssetUpdateBefore,
} from "./types/AssetEvents";
import { AssetHistoryService } from "./AssetHistoryService";

export class AssetService {
  private context: PluginContext;
  private config: DeviceManagerConfiguration;
  private assetHistoryService: AssetHistoryService;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  private get app(): Backend {
    return global.app;
  }

  constructor(plugin: DeviceManagerPlugin, assetHistoryService: AssetHistoryService) {
    this.context = plugin.context;
    this.config = plugin.config;
    this.assetHistoryService = assetHistoryService;
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

  public async get(
    engineId: string,
    assetId: string
  ): Promise<KDocument<AssetContent>> {
    const asset = await this.sdk.document.get<AssetContent>(
      engineId,
      InternalCollection.ASSETS,
      assetId
    );

    return asset;
  }

  /**
   * Updates an asset metadata
   *
   * @todo use impersonated SDK to preserve Kuzzle metadata
   */
  public async update(
    engineId: string,
    assetId: string,
    metadata: Metadata,
    { refresh }: { refresh: any }
  ): Promise<KDocument<AssetContent>> {
    return lock(`asset:${engineId}:${assetId}`, async () => {
      const asset = await this.get(engineId, assetId);

      const updatedPayload = await this.app.trigger<EventAssetUpdateBefore>(
        "device-manager:asset:update:before",
        { asset, metadata }
      );

      const updatedAsset = await this.sdk.document.update<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        assetId,
        { metadata: updatedPayload.metadata },
        { refresh, source: true }
      );

      await this.assetHistoryService.add(
        engineId,
        ["metadata"],
        updatedAsset
      );

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
  ): Promise<KDocument<AssetContent>> {
    const assetId = AssetSerializer.id(model, reference);

    return lock(`asset:${engineId}:${assetId}`, async () => {
      const engine = await this.getEngine(engineId);
      const assetModel = await ask<AskModelAssetGet>(
        "ask:device-manager:model:asset:get",
        { engineGroup: engine.group, model }
      );

      const assetMetadata = {};
      for (const metadataName of Object.keys(
        assetModel.asset.metadataMappings
      )) {
        assetMetadata[metadataName] = null;
      }
      for (const [metadataName, metadataValue] of Object.entries(
        assetModel.asset.defaultMetadata
      )) {
        _.set(assetMetadata, metadataName, metadataValue);
      }

      const measures: Record<string, EmbeddedMeasure> = {};

      for (const { name } of assetModel.asset.measures) {
        measures[name] = null;
      }

      const asset = await this.sdk.document.create<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        {
          linkedDevices: [],
          measures,
          metadata: { ...assetMetadata, ...metadata },
          model,
          reference,
        },
        assetId,
        { refresh }
      );

      await this.assetHistoryService.add(engineId, ["metadata"], asset);

      return asset;
    });
  }

  public async delete(
    engineId: string,
    assetId: string,
    { refresh, strict }: { refresh: any; strict: boolean }
  ) {
    return lock<void>(`asset:${engineId}:${assetId}`, async () => {
      const asset = await this.get(engineId, assetId);

      if (strict && asset._source.linkedDevices.length !== 0) {
        throw new BadRequestError(
          `Asset "${assetId}" is still linked to devices.`
        );
      }

      for (const { _id: deviceId } of asset._source.linkedDevices) {
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

  private async getEngine(engineId: string): Promise<JSONObject> {
    const engine = await this.sdk.document.get(
      this.config.adminIndex,
      InternalCollection.CONFIG,
      `engine-device-manager--${engineId}`
    );

    return engine._source.engine;
  }
}
