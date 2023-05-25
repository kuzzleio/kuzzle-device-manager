import { ControllerDefinition, EmbeddedSDK, KuzzleRequest, User } from "kuzzle";

import { DeviceManagerPlugin } from "../plugin";
import {
  AssetsGroupsBodyRequest,
  ApiGroupAddAssetsRequest,
  ApiGroupAddAssetsResult,
  ApiGroupCreateResult,
  ApiGroupDeleteResult,
  ApiGroupReadResult,
  ApiGroupSearchResult,
  ApiGroupUpdateResult,
} from "./types/AssetGroupsAPI";

// Fixtures
import {
  assetGroupTestId,
  assetGroupTestBody,
  assetGroupTestParentId,
  assetGroupTestParentBody,
  assetGroupTestChildrenId,
  assetGroupTestChildrenBody,
} from "../../../tests/fixtures/assetsGroups";

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
        read: {
          handler: this.read.bind(this),
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

  async create(request: KuzzleRequest): Promise<ApiGroupCreateResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody() as AssetsGroupsBodyRequest;

    // TODO implement create on database
    // eslint-disable-next-line no-console
    console.debug({
      _id,
      action: request.getAction(),
      body,
      engineId,
    });

    return {
      _id,
      _source: { children: [], parent: null, ...body },
    };
  }

  async read(request: KuzzleRequest): Promise<ApiGroupReadResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();

    // TODO implement get by id on database
    // eslint-disable-next-line no-console
    console.debug({
      _id,
      action: request.getAction(),
      engineId,
    });

    return {
      _id,
      _source: assetGroupTestBody,
    };
  }

  async update(request: KuzzleRequest): Promise<ApiGroupUpdateResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody() as AssetsGroupsBodyRequest;

    // TODO implement update on database
    // eslint-disable-next-line no-console
    console.debug({
      _id,
      action: request.getAction(),
      body,
      engineId,
    });

    return {
      _id,
      _source: { parent: null, ...body },
    };
  }

  async delete(request: KuzzleRequest): Promise<ApiGroupDeleteResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();

    // TODO implement delete on database
    // eslint-disable-next-line no-console
    console.debug({
      _id,
      action: request.getAction(),
      engineId,
    });
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

    // TODO implement search on database
    // eslint-disable-next-line no-console
    console.debug({
      action: request.getAction(),
      engineId,
      from,
      lang,
      scroll,
      searchBody,
      size,
    });

    const hits: ApiGroupSearchResult["hits"] = [
      {
        _id: assetGroupTestId,
        _score: 1,
        _source: assetGroupTestBody,
      },
      {
        _id: assetGroupTestParentId,
        _score: 1,
        _source: assetGroupTestParentBody,
      },
      {
        _id: assetGroupTestChildrenId,
        _score: 1,
        _source: assetGroupTestChildrenBody,
      },
    ];

    return {
      fetched: hits.length,
      hits,
      next: async () => null,
      total: hits.length,
    };
  }

  async addAsset(request: KuzzleRequest): Promise<ApiGroupAddAssetsResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody() as ApiGroupAddAssetsRequest["body"];

    // TODO implement addAsset on database
    // eslint-disable-next-line no-console
    console.debug({
      _id,
      action: request.getAction(),
      body,
      engineId,
    });
  }
}
