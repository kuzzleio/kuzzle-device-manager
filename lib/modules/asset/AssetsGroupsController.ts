import {
  BadRequestError,
  ControllerDefinition,
  EmbeddedSDK,
  KuzzleRequest,
  NameGenerator,
  User,
} from "kuzzle";

import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import { AssetContent } from "./exports";
import {
  AssetsGroupContent,
  AssetsGroupsBody,
} from "./types/AssetGroupContent";
import {
  ApiGroupAddAssetsRequest,
  ApiGroupAddAssetsResult,
  ApiGroupCreateResult,
  ApiGroupDeleteResult,
  ApiGroupGetResult,
  ApiGroupRemoveAssetsRequest,
  ApiGroupRemoveAssetsResult,
  ApiGroupSearchResult,
  ApiGroupUpdateResult,
  AssetsGroupsBodyRequest,
} from "./types/AssetGroupsApi";

export class AssetsGroupsController {
  definition: ControllerDefinition;

  constructor(private plugin: DeviceManagerPlugin) {
    /* eslint-disable sort-keys */
    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assetsGroups/:_id",
              verb: "post",
            },
          ],
        },
        get: {
          handler: this.get.bind(this),
          http: [
            { path: "device-manager/:engineId/assetsGroups/:_id", verb: "get" },
          ],
        },
        update: {
          handler: this.update.bind(this),
          http: [
            { path: "device-manager/:engineId/assetsGroups/:_id", verb: "put" },
          ],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assetsGroups/:_id",
              verb: "delete",
            },
          ],
        },
        search: {
          handler: this.search.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assetsGroups/_search",
              verb: "get",
            },
            {
              path: "device-manager/:engineId/assetsGroups/_search",
              verb: "post",
            },
          ],
        },
        addAsset: {
          handler: this.addAsset.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assetsGroups/:_id/addAsset",
              verb: "post",
            },
          ],
        },
        removeAsset: {
          handler: this.removeAsset.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assetsGroups/:_id/removeAsset",
              verb: "post",
            },
          ],
        },
      },
    };
    /* eslint-enable sort-keys */
  }

  private get sdk() {
    return this.plugin.context.accessors.sdk;
  }

  private get as() {
    return (user: User | null): EmbeddedSDK => {
      if (user?._id) {
        return this.sdk.as(user, { checkRights: true });
      }
      return this.sdk;
    };
  }

  async checkParent(
    engineId: string,
    parent: AssetsGroupsBodyRequest["parent"]
  ): Promise<void> {
    if (typeof parent !== "string") {
      return;
    }

    try {
      const assetGroup = await this.sdk.document.get<AssetsGroupContent>(
        engineId,
        InternalCollection.ASSETS_GROUPS,
        parent
      );

      if (assetGroup._source.parent !== null) {
        throw new BadRequestError(
          `Can't create asset group with more than one nesting level`
        );
      }
    } catch (error) {
      if (error.status === 404) {
        throw new BadRequestError(
          `The parent group "${parent}" does not exist`
        );
      }
      throw error;
    }
  }

  async checkChildren(
    engineId: string,
    children: AssetsGroupsBodyRequest["children"]
  ): Promise<void> {
    if (!Array.isArray(children)) {
      throw new BadRequestError("The Children property should be an array");
    }

    if (children.length === 0) {
      return;
    }

    const { result } = await this.sdk.query({
      action: "mExists",
      body: {
        ids: children,
      },
      collection: InternalCollection.ASSETS_GROUPS,
      controller: "document",
      index: engineId,
    });

    if (Array.isArray(result.errors) && result.errors.length > 0) {
      throw new BadRequestError(
        `The children group "${result.errors.join(",")}" does not exist`
      );
    }
  }

  async checkGroupName(
    engineId: string,
    name: AssetsGroupsBodyRequest["name"],
    assetId?: string
  ) {
    if (typeof name !== "string") {
      return;
    }

    const groupsCount = await this.sdk.document.count(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      {
        query: {
          bool: {
            must: [
              {
                regexp: {
                  name: {
                    case_insensitive: true,
                    value: name,
                  },
                },
              },
            ],
            must_not: [
              {
                terms: {
                  _id: typeof assetId === "string" ? [assetId] : [],
                },
              },
            ],
          },
        },
      }
    );

    if (groupsCount > 0) {
      throw new BadRequestError(`A group with name "${name}" already exist`);
    }
  }

  async create(request: KuzzleRequest): Promise<ApiGroupCreateResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId({
      generator: () => NameGenerator.generateRandomName({ prefix: "group" }),
      ifMissing: "generate",
    });
    const body = request.getBody() as AssetsGroupsBodyRequest;

    await this.checkParent(engineId, body.parent);
    await this.checkGroupName(engineId, body.name);

    if (typeof body.name !== "string") {
      throw new BadRequestError(`A group must have a name`);
    }

    if (typeof body.parent === "string") {
      const parentGroup = await this.sdk.document.get<AssetsGroupsBody>(
        engineId,
        InternalCollection.ASSETS_GROUPS,
        body.parent
      );

      const children = parentGroup._source.children ?? [];
      children.push(_id);

      this.sdk.document.update<AssetsGroupsBody>(
        engineId,
        InternalCollection.ASSETS_GROUPS,
        body.parent,
        {
          children,
          lastUpdate: Date.now(),
        }
      );
    }

    return this.as(request.getUser()).document.create<AssetsGroupsBody>(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      {
        children: [],
        lastUpdate: Date.now(),
        name: body.name,
        parent: body.parent ?? null,
      },
      _id
    );
  }

  async get(request: KuzzleRequest): Promise<ApiGroupGetResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();

    return this.as(request.getUser()).document.get<AssetsGroupsBody>(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      _id
    );
  }

  async update(request: KuzzleRequest): Promise<ApiGroupUpdateResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody() as AssetsGroupsBodyRequest;

    await this.checkParent(engineId, body.parent);
    await this.checkChildren(engineId, body.children);
    await this.checkGroupName(engineId, body.name, _id);

    return this.as(request.getUser()).document.update<AssetsGroupsBody>(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      _id,
      {
        parent: null,
        ...body,
        lastUpdate: Date.now(),
      },
      { source: true }
    );
  }

  async delete(request: KuzzleRequest): Promise<ApiGroupDeleteResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();

    const { _source: assetGroup } =
      await this.sdk.document.get<AssetsGroupsBody>(
        engineId,
        InternalCollection.ASSETS_GROUPS,
        _id
      );

    if (assetGroup.parent !== null) {
      const { _source: parentGroup } =
        await this.sdk.document.get<AssetsGroupsBody>(
          engineId,
          InternalCollection.ASSETS_GROUPS,
          assetGroup.parent
        );
      await this.sdk.document.update(
        engineId,
        InternalCollection.ASSETS_GROUPS,
        assetGroup.parent,
        {
          children: parentGroup.children.filter((children) => children !== _id),
          lastUpdate: Date.now(),
        }
      );
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
      { strict: true }
    );

    const { hits: assets } = await this.sdk.document.search<AssetContent>(
      engineId,
      InternalCollection.ASSETS,
      { query: { equals: { "groups.id": _id } } },
      { lang: "koncorde" }
    );

    await this.sdk.document.mUpdate(
      engineId,
      InternalCollection.ASSETS,
      assets.map((asset) => ({
        _id: asset._id,
        body: {
          groups: asset._source.groups.filter(
            ({ id: groupId }) => groupId !== _id
          ),
        },
      })),
      { strict: true }
    );

    await this.as(request.getUser()).document.delete(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      _id
    );
  }

  async search(request: KuzzleRequest): Promise<ApiGroupSearchResult> {
    const engineId = request.getString("engineId");
    const {
      searchBody,
      from,
      size,
      scrollTTL: scroll,
    } = request.getSearchParams();
    const lang = request.getLangParam();

    return this.as(request.getUser()).document.search<AssetsGroupContent>(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      searchBody,
      { from, lang, scroll, size }
    );
  }

  async addAsset(request: KuzzleRequest): Promise<ApiGroupAddAssetsResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody() as ApiGroupAddAssetsRequest["body"];

    // ? Get document to check if really exists, even if not indexed
    const assetGroup = await this.sdk.document.get<AssetsGroupContent>(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      _id
    );

    const assets = [];
    for (const assetId of body.assetIds) {
      const assetContent = (
        await this.sdk.document.get(
          engineId,
          InternalCollection.ASSETS,
          assetId
        )
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

    const assetsGroupsUpdate = await this.as(
      request.getUser()
    ).document.update<AssetsGroupsBody>(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      _id,
      {
        lastUpdate: Date.now(),
      },
      { source: true }
    );

    const update = await this.sdk.document.mReplace(
      engineId,
      InternalCollection.ASSETS,
      assets
    );

    return {
      ...update,
      assetsGroups: assetsGroupsUpdate,
    };
  }

  async removeAsset(
    request: KuzzleRequest
  ): Promise<ApiGroupRemoveAssetsResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody() as ApiGroupRemoveAssetsRequest["body"];

    // ? Get document to check if really exists, even if not indexed
    const { _source: AssetGroupContent } =
      await this.sdk.document.get<AssetsGroupContent>(
        engineId,
        InternalCollection.ASSETS_GROUPS,
        _id
      );

    const removedGroups = AssetGroupContent.children;
    removedGroups.push(_id);

    const assets = [];
    for (const assetId of body.assetIds) {
      const assetContent = (
        await this.sdk.document.get<AssetContent>(
          engineId,
          InternalCollection.ASSETS,
          assetId
        )
      )._source;

      if (!Array.isArray(assetContent.groups)) {
        continue;
      }

      assetContent.groups = assetContent.groups.filter(
        ({ id: groupId }) => !removedGroups.includes(groupId)
      );

      assets.push({
        _id: assetId,
        body: assetContent,
      });
    }

    const assetsGroupsUpdate = await this.as(
      request.getUser()
    ).document.update<AssetsGroupsBody>(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      _id,
      {
        lastUpdate: Date.now(),
      },
      { source: true }
    );

    const update = await this.sdk.document.mReplace(
      engineId,
      InternalCollection.ASSETS,
      assets
    );

    return {
      ...update,
      assetsGroups: assetsGroupsUpdate,
    };
  }
}
