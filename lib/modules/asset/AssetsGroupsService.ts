import { JSONObject, KDocument } from "kuzzle-sdk";
import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import { BaseService, SearchParams } from "../shared";
import { KuzzleRequest } from "kuzzle";
import {
  AssetsGroupContent,
  AssetsGroupsBody,
} from "./types/AssetGroupContent";
import { AskModelGroupGet } from "../model";
import { ask } from "kuzzle-plugin-commons";
import { AssetContent } from "./types/AssetContent";

export class AssetsGroupsService extends BaseService {
  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);
  }

  async create(
    _id: string,
    engineId: string,
    metadata: JSONObject,
    model: string,
    name: string,
    parent: string | null,
    request: KuzzleRequest,
  ): Promise<KDocument<AssetsGroupContent>> {
    if (parent !== null) {
      const parentGroup = await this.sdk.document.get<AssetsGroupsBody>(
        engineId,
        InternalCollection.ASSETS_GROUPS,
        parent,
      );

      const children = parentGroup._source.children ?? [];
      children.push(_id);

      await this.sdk.document.update<AssetsGroupsBody>(
        engineId,
        InternalCollection.ASSETS_GROUPS,
        parent,
        {
          children,
          lastUpdate: Date.now(),
        },
      );
    }

    const groupMetadata = {};

    if (model !== null) {
      const groupModel = await ask<AskModelGroupGet>(
        "ask:device-manager:model:group:get",
        { model },
      );
      for (const metadataName of Object.keys(
        groupModel.group.metadataMappings,
      )) {
        if (metadata[metadataName]) {
          groupMetadata[metadataName] = metadata[metadataName];
        } else if (groupModel.group.defaultMetadata[metadataName]) {
          groupMetadata[metadataName] =
            groupModel.group.defaultMetadata[metadataName];
        } else {
          groupMetadata[metadataName] = null;
        }
      }
    }
    const group: KDocument<AssetsGroupContent> = {
      _id,
      _source: {
        children: [],
        lastUpdate: Date.now(),
        metadata: { ...groupMetadata },
        model,
        name,
        parent,
      },
    };
    return this.createDocument<AssetsGroupContent>(request, group, {
      collection: InternalCollection.ASSETS_GROUPS,
      engineId,
    });
  }

  async get(engineId: string, _id: string, request: KuzzleRequest) {
    return this.getDocument<AssetsGroupContent>(request, _id, {
      collection: InternalCollection.ASSETS_GROUPS,
      engineId,
    });
  }

  async update(
    request: KuzzleRequest,
    _id: string,
    engineId: string,
    updateContent: JSONObject,
  ) {
    const updatedGroup = await this.updateDocument<AssetsGroupContent>(
      request,
      {
        _id,
        _source: updateContent,
      },
      { collection: InternalCollection.ASSETS_GROUPS, engineId },
      { source: true, triggerEvents: true },
    );

    return updatedGroup;
  }
  async delete(_id: string, engineId: string, request: KuzzleRequest) {
    const { _source: assetGroup } = await this.get(engineId, _id, request);

    if (assetGroup.parent !== null) {
      const { _source: parentGroup } = await this.get(
        engineId,
        assetGroup.parent,
        request,
      );
      await this.update(request, assetGroup.parent, engineId, {
        children: parentGroup.children.filter((children) => children !== _id),
        lastUpdate: Date.now(),
      });
    }

    await this.sdk.document.mUpdate(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      assetGroup.children.map((childrenId) => ({
        _id: childrenId,
        body: {
          lastUpdate: Date.now(),
          parent: null,
        },
      })),
      { strict: true },
    );

    const { hits: assets } = await this.sdk.document.search<AssetContent>(
      engineId,
      InternalCollection.ASSETS,
      { query: { equals: { "groups.id": _id } } },
      { lang: "koncorde" },
    );

    await this.sdk.document.mUpdate(
      engineId,
      InternalCollection.ASSETS,
      assets.map((asset) => ({
        _id: asset._id,
        body: {
          groups: asset._source.groups.filter(
            ({ id: groupId }) => groupId !== _id,
          ),
        },
      })),
      { strict: true },
    );

    return this.deleteDocument(request, _id, {
      collection: InternalCollection.ASSETS_GROUPS,
      engineId,
    });
  }
  async search(
    engineId: string,
    searchParams: SearchParams,
    request: KuzzleRequest,
  ) {
    return this.searchDocument<AssetsGroupContent>(request, searchParams, {
      collection: InternalCollection.ASSETS_GROUPS,
      engineId,
    });
  }
  async addAsset(
    engineId: string,
    _id: string,
    assetIds: string[],
    request: KuzzleRequest,
  ) {
    const assetGroup = await this.get(engineId, _id, request);

    const assets = [];
    for (const assetId of assetIds) {
      const assetContent = (
        await this.getDocument<AssetContent>(request, assetId, {
          collection: InternalCollection.ASSETS,
          engineId,
        })
      )._source;

      if (!Array.isArray(assetContent.groups)) {
        assetContent.groups = [];
      }

      if (assetGroup._source.parent !== null) {
        assetContent.groups.push({
          date: Date.now(),
          id: assetGroup._source.parent,
        });
      }

      assetContent.groups.push({
        date: Date.now(),
        id: _id,
      });

      assets.push({
        _id: assetId,
        body: assetContent,
      });
    }

    const assetsGroupsUpdate = await this.update(request, _id, engineId, {
      lastUpdate: Date.now(),
    });

    const update = await this.sdk.document.mReplace(
      engineId,
      InternalCollection.ASSETS,
      assets,
      { triggerEvents: true },
    );

    return {
      ...update,
      assetsGroups: assetsGroupsUpdate,
    };
  }
  async removeAsset(
    engineId: string,
    _id: string,
    assetIds: string[],
    request: KuzzleRequest,
  ) {
    const { _source: AssetGroupContent } = await this.get(
      engineId,
      _id,
      request,
    );

    const removedGroups = AssetGroupContent.children;
    removedGroups.push(_id);

    const assets = [];
    for (const assetId of assetIds) {
      const assetContent = (
        await this.getDocument<AssetContent>(request, assetId, {
          collection: InternalCollection.ASSETS,
          engineId,
        })
      )._source;

      if (!Array.isArray(assetContent.groups)) {
        continue;
      }

      assetContent.groups = assetContent.groups.filter(
        ({ id: groupId }) => !removedGroups.includes(groupId),
      );

      assets.push({
        _id: assetId,
        body: assetContent,
      });
    }

    const assetsGroupsUpdate = await this.update(request, _id, engineId, {
      lastUpdate: Date.now(),
    });

    const update = await this.sdk.document.mReplace(
      engineId,
      InternalCollection.ASSETS,
      assets,
      { triggerEvents: true },
    );

    return {
      ...update,
      assetsGroups: assetsGroupsUpdate,
    };
  }
}
