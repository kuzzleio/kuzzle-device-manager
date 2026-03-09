import {
  BadRequestError,
  ControllerDefinition,
  EmbeddedSDK,
  KuzzleRequest,
  NameGenerator,
  User,
} from "kuzzle";
import { ask } from "kuzzle-plugin-commons";

import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import { AssetsGroupContent } from "./types/AssetGroupContent";
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
import { AskModelGroupGet } from "../model";
import { AssetsGroupsService } from "./AssetsGroupsService";

export class AssetsGroupsController {
  definition: ControllerDefinition;

  constructor(
    private plugin: DeviceManagerPlugin,
    private assetsGroupsService: AssetsGroupsService,
  ) {
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
        return this.sdk.as(user, { checkRights: false });
      }
      return this.sdk;
    };
  }

  async checkParent(
    engineId: string,
    parent: AssetsGroupsBodyRequest["parent"],
  ): Promise<void> {
    if (typeof parent !== "string") {
      return;
    }

    try {
      const assetGroup = await this.sdk.document.get<AssetsGroupContent>(
        engineId,
        InternalCollection.ASSETS_GROUPS,
        parent,
      );

      if (assetGroup._source.parent !== null) {
        throw new BadRequestError(
          `Can't create asset group with more than one nesting level`,
        );
      }
    } catch (error) {
      if (error.status === 404) {
        throw new BadRequestError(
          `The parent group "${parent}" does not exist`,
        );
      }
      throw error;
    }
  }

  async checkChildren(
    engineId: string,
    children: AssetsGroupsBodyRequest["children"],
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
        `The children group "${result.errors.join(",")}" does not exist`,
      );
    }
  }

  async checkGroupName(
    engineId: string,
    name: AssetsGroupsBodyRequest["name"],
    groupId?: string,
  ) {
    if (typeof name !== "string") {
      return;
    }

    const groupsCount = await this.sdk.document.search(
      engineId,
      InternalCollection.ASSETS_GROUPS,
      {
        _source: false,
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
          },
        },
      },
    );

    if (groupsCount.hits.filter((hit) => hit._id !== groupId).length > 0) {
      throw new BadRequestError(`A group with name "${name}" already exist`);
    }
  }

  async create(request: KuzzleRequest): Promise<ApiGroupCreateResult> {
    const engineId = request.getString("engineId");
    const name = request.getBodyString("name");
    const metadata = request.getBodyObject("metadata", {});
    const body = request.getBody();
    const model = body.model ?? null;
    const parent = body.parent ?? null;

    const _id = request.getId({
      generator: () => NameGenerator.generateRandomName({ prefix: "group" }),
      ifMissing: "generate",
    });

    await this.checkGroupName(engineId, name);
    if (parent !== null) {
      await this.checkParent(engineId, parent);
    }
    return this.assetsGroupsService.create(
      _id,
      engineId,
      metadata,
      model,
      name,
      parent,
      request,
    );
  }

  async get(request: KuzzleRequest): Promise<ApiGroupGetResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();

    return this.assetsGroupsService.get(engineId, _id, request);
  }

  async update(request: KuzzleRequest): Promise<ApiGroupUpdateResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody();
    const name = body.name;
    const metadata = body.metadata;
    const children = body.children;
    const parent = body.parent;

    let updateRequestBody = {};
    if (parent !== undefined) {
      await this.checkParent(engineId, parent);
      updateRequestBody = { ...updateRequestBody, parent };
    }
    if (children !== undefined) {
      await this.checkChildren(engineId, children);
      updateRequestBody = { ...updateRequestBody, children };
    }
    if (name !== undefined) {
      await this.checkGroupName(engineId, name, _id);
      updateRequestBody = { ...updateRequestBody, name };
    }

    if (metadata !== undefined) {
      const group = await this.get(request);
      const { model, metadata: groupMetadata } = group._source;
      if (model !== null) {
        const groupModel = await ask<AskModelGroupGet>(
          "ask:device-manager:model:group:get",
          {
            model,
          },
        );
        for (const metadataName of Object.keys(
          groupModel.group.metadataMappings,
        )) {
          if (metadata[metadataName] !== undefined) {
            groupMetadata[metadataName] = metadata[metadataName];
          }
        }
        updateRequestBody = { ...updateRequestBody, metadata: groupMetadata };
      }
    }
    updateRequestBody = { ...updateRequestBody, lastUpdate: Date.now() };
    return this.assetsGroupsService.update(
      request,
      _id,
      engineId,
      updateRequestBody,
    );
  }

  async delete(request: KuzzleRequest): Promise<ApiGroupDeleteResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    await this.assetsGroupsService.delete(_id, engineId, request);
  }

  async search(request: KuzzleRequest): Promise<ApiGroupSearchResult> {
    const engineId = request.getString("engineId");
    const searchParams = request.getSearchParams();

    return this.assetsGroupsService.search(engineId, searchParams, request);
  }

  async addAsset(request: KuzzleRequest): Promise<ApiGroupAddAssetsResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody() as ApiGroupAddAssetsRequest["body"];
    const assetIds = body.assetIds;
    return this.assetsGroupsService.addAsset(engineId, _id, assetIds, request);
  }

  async removeAsset(
    request: KuzzleRequest,
  ): Promise<ApiGroupRemoveAssetsResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody() as ApiGroupRemoveAssetsRequest["body"];

    return this.assetsGroupsService.removeAsset(
      engineId,
      _id,
      body.assetIds,
      request,
    );
  }
}
