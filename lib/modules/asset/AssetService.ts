import { Backend, BadRequestError, PluginContext, User } from "kuzzle";
import {
  BaseRequest,
  DocumentSearchResult,
  JSONObject,
  KDocument,
  KHit,
  SearchResult,
  mReplaceResponse,
} from "kuzzle-sdk";
import _ from "lodash";

import {
  AskDeviceAttachEngine,
  AskDeviceDetachEngine,
  AskDeviceLinkAsset,
  AskDeviceUnlinkAsset,
} from "../device";
import { AskModelAssetGet, AssetModelContent } from "../model";
import {
  AskEngineList,
  DeviceManagerConfiguration,
  DeviceManagerPlugin,
  InternalCollection,
} from "../plugin";
import {
  EmbeddedMeasure,
  Metadata,
  ask,
  flattenObject,
  lock,
  onAsk,
} from "../shared";

import { AssetHistoryService } from "./AssetHistoryService";
import { AssetSerializer } from "./model/AssetSerializer";
import { AssetContent } from "./types/AssetContent";
import {
  AskAssetRefreshModel,
  EventAssetUpdateAfter,
  EventAssetUpdateBefore,
} from "./types/AssetEvents";
import {
  AssetHistoryContent,
  AssetHistoryEventMetadata,
} from "./types/AssetHistoryContent";

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

  private get impersonatedSdk() {
    return (user: User) => {
      if (user?._id) {
        return this.sdk.as(user, { checkRights: false });
      }

      return this.sdk;
    };
  }

  constructor(
    plugin: DeviceManagerPlugin,
    assetHistoryService: AssetHistoryService
  ) {
    this.context = plugin.context;
    this.config = plugin.config;
    this.assetHistoryService = assetHistoryService;

    this.registerAskEvents();
  }

  registerAskEvents() {
    onAsk<AskAssetRefreshModel>(
      "ask:device-manager:asset:refresh-model",
      this.refreshModel.bind(this)
    );
  }

  public async get(
    engineId: string,
    assetId: string
  ): Promise<KDocument<AssetContent>> {
    return this.sdk.document.get<AssetContent>(
      engineId,
      InternalCollection.ASSETS,
      assetId
    );
  }

  /**
   * Updates an asset metadata
   */
  public async update(
    user: User,
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

      const updatedAsset = await this.impersonatedSdk(
        user
      ).document.update<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        assetId,
        { metadata: updatedPayload.metadata },
        { refresh, source: true }
      );

      await this.assetHistoryService.add<AssetHistoryEventMetadata>(engineId, [
        {
          asset: updatedAsset._source,
          event: {
            metadata: {
              names: Object.keys(flattenObject(updatedPayload.metadata)),
            },
            name: "metadata",
          },
          id: updatedAsset._id,
          timestamp: Date.now(),
        },
      ]);

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
    user: User,
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

      const asset = await this.impersonatedSdk(
        user
      ).document.create<AssetContent>(
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

      await this.assetHistoryService.add<AssetHistoryEventMetadata>(engineId, [
        {
          asset: asset._source,
          event: {
            metadata: {
              names: Object.keys(flattenObject(asset._source.metadata)),
            },
            name: "metadata",
          },
          id: asset._id,
          timestamp: Date.now(),
        },
      ]);

      return asset;
    });
  }

  public async delete(
    user: User,
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
        await ask<AskDeviceUnlinkAsset>(
          "ask:device-manager:device:unlink-asset",
          { deviceId, user }
        );
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

  public async migrateTenant(
    user: User,
    assetsList: string[],
    engineId: string,
    newEngineId: string
  ): Promise<void> {
    let migrated = 0;

    return await lock(`engine:${engineId}:${newEngineId}`, async () => {
      if (!user.profileIds.includes("admin")) {
        throw new BadRequestError(
          `User ${user._id} is not authorized to migrate assets`
        );
      }

      try {
        // check if tenant destination is of the same group
        const engine = await this.getEngine(engineId);
        const newEngine = await this.getEngine(newEngineId);

        if (engine.group !== newEngine.group) {
          throw new BadRequestError(
            `Engine ${newEngineId} is not in the same group as ${engineId}`
          );
        }

        if (assetsList.length === 0) {
          throw new BadRequestError("No assets to migrate");
        }

        //For all assets, check if they already exists in the destination tenant
        const assetsInDest = await this.sdk.document.mGet<AssetContent>(
          newEngineId,
          InternalCollection.ASSETS,
          assetsList
        );
        const assetsIdInDest = assetsInDest.successes.map((a) => a._id);
        //And if yes, remove them from the list to use
        const assetsListFiltered = assetsList.filter(
          (id) => !assetsIdInDest.includes(id)
        );
        if (assetsListFiltered.length === 0) {
          throw new BadRequestError("No available assets to migrate");
        }

        //Get all true/available assets to migrate
        const assets = await this.sdk.document.mGet<AssetContent>(
          engineId,
          InternalCollection.ASSETS,
          assetsListFiltered
        );

        //Iterate over all asset, and migrate each one
        for (const asset of assets.successes) {
          // Create the assets in the new tenant, with empty linkedDevices and groups
          const assetContent = Object.assign({}, asset._source);
          assetContent.linkedDevices = [];
          assetContent.groups = [];
          await this.sdk.document.create<AssetContent>(
            newEngineId,
            InternalCollection.ASSETS,
            assetContent,
            asset._id
          );

          // get linked devices to this asset, if any
          const linkedDevices = asset._source.linkedDevices.map((d) => ({
            _id: d._id,
            measureNames: d.measureNames,
          }));

          // ... ant iterate over this list
          for (const device of linkedDevices) {
            // detach linked devices from current tenant (it also unkinks asset)
            await ask<AskDeviceDetachEngine>(
              "ask:device-manager:device:detach-engine",
              { deviceId: device._id, user }
            );

            // ... and attach to new tenant
            await ask<AskDeviceAttachEngine>(
              "ask:device-manager:device:attach-engine",
              { deviceId: device._id, engineId: newEngineId, user }
            );

            // ... and link this device to the asset in the new tenant
            await ask<AskDeviceLinkAsset>(
              "ask:device-manager:device:link-asset",
              {
                assetId: asset._id,
                deviceId: device._id,
                engineId: newEngineId,
                measureNames: device.measureNames,
                user,
              }
            );
          }

          // Finally here, we can delete the asset in the source engine !
          await this.sdk.document.delete(
            engineId,
            InternalCollection.ASSETS,
            asset._id
          );

          migrated++;
        }
      } catch (error) {
        throw new BadRequestError(
          `An error occured while migrating assets: ${error}`
        );
      }

      if (!migrated) {
        throw new BadRequestError(
          `Error occured while migrating all the assets !`
        );
      } else {
        const collectionsToRefresh = [
          {
            collection: InternalCollection.ASSETS,
            engine: engineId,
          },
          {
            collection: InternalCollection.DEVICES,
            engine: engineId,
          },
          {
            collection: InternalCollection.ASSETS,
            engine: newEngineId,
          },
          {
            collection: InternalCollection.DEVICES,
            engine: newEngineId,
          },
          {
            collection: InternalCollection.DEVICES,
            engine: this.config.adminIndex,
          },
        ].map(({ engine, collection }) => {
          return this.sdk.collection.refresh(engine, collection);
        });

        await Promise.all(collectionsToRefresh);
      }
    });
  }

  /**
   * Replace an asset metadata
   */
  public async mReplaceAndHistorize(
    engineId: string,
    assets: KDocument<AssetContent>[],
    removedMetadata: string[],
    { refresh }: { refresh: any }
  ): Promise<mReplaceResponse> {
    const replacedAssets = await this.sdk.document.mReplace<AssetContent>(
      engineId,
      InternalCollection.ASSETS,
      assets.map((asset) => ({ _id: asset._id, body: asset._source })),
      { refresh, source: true }
    );

    const histories: AssetHistoryContent[] = replacedAssets.successes.map(
      (asset) => ({
        asset: asset._source as AssetContent,
        event: {
          metadata: {
            names: Object.keys(flattenObject(asset._source.metadata)),
          },
          name: "metadata",
        },
        id: asset._id,
        timestamp: Date.now(),
      })
    );

    await this.assetHistoryService.add<AssetHistoryEventMetadata>(
      engineId,
      histories
    );

    return replacedAssets;
  }

  private async getEngine(engineId: string): Promise<JSONObject> {
    const engine = await this.sdk.document.get(
      this.config.adminIndex,
      InternalCollection.CONFIG,
      `engine-device-manager--${engineId}`
    );

    return engine._source.engine;
  }

  private async refreshModel({
    assetModel,
  }: {
    assetModel: AssetModelContent;
  }): Promise<void> {
    const engines = await ask<AskEngineList>("ask:device-manager:engine:list", {
      group: assetModel.engineGroup,
    });

    const targets = engines.map((engine) => ({
      collections: [InternalCollection.ASSETS],
      index: engine.index,
    }));

    const assets = await this.sdk.query<
      BaseRequest,
      DocumentSearchResult<AssetContent>
    >({
      action: "search",
      body: { query: { equals: { model: assetModel.asset.model } } },
      controller: "document",
      lang: "koncorde",
      targets,
    });

    const modelMetadata = {};

    for (const metadataName of Object.keys(assetModel.asset.metadataMappings)) {
      const defaultMetadata = assetModel.asset.defaultMetadata[metadataName];
      modelMetadata[metadataName] = defaultMetadata ?? null;
    }

    const removedMetadata: string[] = [];

    const updatedAssetsPerIndex: Record<string, KDocument<AssetContent>[]> =
      assets.result.hits.reduce(
        (acc: Record<string, KDocument<AssetContent>[]>, asset: JSONObject) => {
          const assetMetadata = { ...asset._source.metadata };

          for (const key of Object.keys(asset._source.metadata)) {
            if (!(key in modelMetadata)) {
              removedMetadata.push(key);
              delete assetMetadata[key];
            }
          }

          asset._source.metadata = {
            ...modelMetadata,
            ...assetMetadata,
          };

          acc[asset.index].push(asset as KDocument<AssetContent>);

          return acc;
        },
        Object.fromEntries(
          engines.map((engine) => [
            engine.index,
            [] as KDocument<AssetContent>[],
          ])
        )
      );

    await Promise.all(
      Object.entries(updatedAssetsPerIndex).map(([index, updatedAssets]) =>
        this.mReplaceAndHistorize(index, updatedAssets, removedMetadata, {
          refresh: "wait_for",
        })
      )
    );
  }
}
