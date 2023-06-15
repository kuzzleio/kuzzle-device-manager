import {
  BadRequestError,
  ControllerDefinition,
  EmbeddedSDK,
  KuzzleRequest,
  User,
} from "kuzzle";

import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import {
  AssetsGroupsBodyRequest,
  ApiGroupAddAssetsRequest,
  ApiGroupAddAssetsResult,
  ApiGroupCreateResult,
  ApiGroupDeleteResult,
  ApiGroupGetResult,
  ApiGroupSearchResult,
  ApiGroupUpdateResult,
} from "./types/AssetGroupsAPI";
import {
  AssetsGroupsBody,
  AssetsGroupContent,
} from "./types/AssetGroupContent";

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
    body: AssetsGroupsBodyRequest
  ): Promise<void> {
    if (typeof body.parent !== "string") {
      return;
    }
    const parentExist = await this.sdk.document.exists(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      body.parent
    );
    if (!parentExist) {
      throw new BadRequestError(
        `The parent group "${body.parent}" does not exist`
      );
    }
  }

  async checkChildren(
    engineId: string,
    body: AssetsGroupsBodyRequest
  ): Promise<void> {
    if (!Array.isArray(body.children)) {
      throw new BadRequestError("The Children property should be an array");
    }

    if (body.children.length === 0) {
      return;
    }

    const { result } = await this.sdk.query({
      action: "mExists",
      body: {
        ids: body.children,
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

  async create(request: KuzzleRequest): Promise<ApiGroupCreateResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody() as AssetsGroupsBodyRequest;

    await this.checkParent(engineId, body);

    return this.as(request.getUser()).document.create<AssetsGroupsBody>(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      {
        children: [],
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

    await this.checkParent(engineId, body);
    await this.checkChildren(engineId, body);

    return this.as(request.getUser()).document.update<AssetsGroupsBody>(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      _id,
      { parent: null, ...body },
      { source: true }
    );
  }

  async delete(request: KuzzleRequest): Promise<ApiGroupDeleteResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();

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
    await this.sdk.document.get(
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

      assetContent.groups.push(_id);

      assets.push({
        _id: assetId,
        body: assetContent,
      });
    }

    return this.sdk.document.mReplace(
      engineId,
      InternalCollection.ASSETS,
      assets
    );
  }
}
