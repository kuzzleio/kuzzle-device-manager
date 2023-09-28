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
import { RecoveryQueue } from "../shared/utils/recoveryQueue";

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
  ) {
    return lock(`engine:${engineId}:${newEngineId}`, async () => {
      const recovery = new RecoveryQueue();

      try {
        // check if tenant destination of the the same group
        const engine = await this.getEngine(engineId);
        const newEngine = await this.getEngine(newEngineId);

        if (engine.group !== newEngine.group) {
          throw new BadRequestError(
            `Tenant ${newEngineId} is not in the same group as ${engineId}`
          );
        }

        const assets = await this.sdk.document.mGet<AssetContent>(
          engineId,
          InternalCollection.ASSETS,
          assetsList
        );

        // check if the assets exists in the other engine
        const existingAssets = await this.sdk.document.mGet<AssetContent>(
          newEngineId,
          InternalCollection.ASSETS,
          assetsList
        );

        if (existingAssets.successes.length > 0) {
          throw new BadRequestError(
            `Assets ${existingAssets.successes
              .map((asset) => asset._id)
              .join(", ")} already exists in engine ${newEngineId}`
          );
        }
        const assetsToMigrate = assets.successes.map((asset) => ({
          _id: asset._id,
          body: asset._source,
        }));

        const devices = await this.sdk.document.search<AssetContent>(
          engineId,
          InternalCollection.DEVICES,
          {
            query: {
              bool: {
                filter: {
                  terms: {
                    assetId: assetsList,
                  },
                },
              },
            },
          }
        );

        // Map linked devices for assets.
        const assetLinkedDevices = assets.successes
          .filter((asset) => asset._source.linkedDevices.length > 0)
          .map((asset) => ({
            assetId: asset._id,
            linkedDevices: asset._source.linkedDevices,
          }));

        // Extra recovery step to relink back assets to their devices in case of rollback
        recovery.addRecovery(async () => {
          // Link the devices to the new assets
          for (const asset of assetLinkedDevices) {
            const assetId = asset.assetId;
            for (const device of asset.linkedDevices) {
              const deviceId = device._id;
              const measureNames = device.measureNames;
              await ask<AskDeviceLinkAsset>(
                "ask:device-manager:device:link-asset",
                {
                  assetId,
                  deviceId,
                  engineId,
                  measureNames: measureNames,
                  user,
                }
              );
            }
          }
        });

        // detach from current tenant
        for (const device of devices.hits) {
          await ask<AskDeviceDetachEngine>(
            "ask:device-manager:device:detach-engine",
            { deviceId: device._id, user }
          );
          await ask<AskDeviceAttachEngine>(
            "ask:device-manager:device:attach-engine",
            { deviceId: device._id, engineId: newEngineId, user }
          );
        }

        // recovery function to reattach devices to the old tenant
        recovery.addRecovery(async () => {
          for (const device of devices.hits) {
            await ask<AskDeviceDetachEngine>(
              "ask:device-manager:device:detach-engine",
              { deviceId: device._id, user }
            );
            await ask<AskDeviceAttachEngine>(
              "ask:device-manager:device:attach-engine",
              { deviceId: device._id, engineId, user }
            );
          }
        });

        // Create the assets in the new tenant
        await this.sdk.document.mCreate(
          newEngineId,
          InternalCollection.ASSETS,
          assetsToMigrate
        );

        recovery.addRecovery(async () => {
          await this.sdk.document.mDelete(
            newEngineId,
            InternalCollection.ASSETS,
            assetsList
          );
        });

        // Delete the assets in the old tenant
        await this.sdk.document.mDelete(
          engineId,
          InternalCollection.ASSETS,
          assetsList
        );

        recovery.addRecovery(async () => {
          await this.sdk.document.mCreate(
            engineId,
            InternalCollection.ASSETS,
            assetsToMigrate
          );
        });

        // Link the devices to the new assets
        for (const asset of assetLinkedDevices) {
          const assetId = asset.assetId;
          for (const device of asset.linkedDevices) {
            const deviceId = device._id;
            const measureNames = device.measureNames;
            await ask<AskDeviceLinkAsset>(
              "ask:device-manager:device:link-asset",
              {
                assetId,
                deviceId,
                engineId: newEngineId,
                measureNames: measureNames,
                user,
              }
            );
          }
        }

        recovery.addRecovery(async () => {
          for (const asset of assetLinkedDevices) {
            for (const device of asset.linkedDevices) {
              const deviceId = device._id;
              await ask<AskDeviceUnlinkAsset>(
                "ask:device-manager:device:unlink-asset",
                {
                  deviceId,
                  user,
                }
              );
            }
          }
        });
      } catch (error) {
        await recovery.rollback();
        throw new BadRequestError(
          `An error occured while migrating assets: ${error}`
        );
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
