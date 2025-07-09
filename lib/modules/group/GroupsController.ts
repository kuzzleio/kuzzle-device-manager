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
<<<<<<< HEAD:lib/modules/asset/AssetsGroupsController.ts
import { AssetsGroupContent, AssetsGroupsBody } from "./types/AssetGroupContent";
=======
>>>>>>> fd554d5 (feat(group): separate group logic from assets):lib/modules/group/GroupsController.ts
import {
  ApiGroupAddAssetsRequest,
  ApiGroupAddAssetsResult,
  ApiGroupCreateRequest,
  ApiGroupCreateResult,
  ApiGroupDeleteResult,
  ApiGroupGetResult,
  ApiGroupRemoveAssetsRequest,
  ApiGroupRemoveAssetsResult,
  ApiGroupSearchResult,
  ApiGroupUpdateResult,
<<<<<<< HEAD:lib/modules/asset/AssetsGroupsController.ts
  AssetsGroupsBodyRequest,
} from "./types/AssetGroupsApi";
import { AskModelGroupGet } from "../model";
import { AssetsGroupsService } from "./AssetsGroupsService";
import { AssetContent } from "./exports";
=======
  GroupsBodyRequest,
} from "./types/GroupsApi";
import { GroupContent, GroupsBody } from "./types/GroupContent";
import { AssetContent } from "../asset";
>>>>>>> fd554d5 (feat(group): separate group logic from assets):lib/modules/group/GroupsController.ts

export class GroupsController {
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
              path: "device-manager/:engineId/groups/:_id",
              verb: "post",
            },
          ],
        },
        get: {
          handler: this.get.bind(this),
          http: [{ path: "device-manager/:engineId/groups/:_id", verb: "get" }],
        },
        update: {
          handler: this.update.bind(this),
          http: [{ path: "device-manager/:engineId/groups/:_id", verb: "put" }],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/:_id",
              verb: "delete",
            },
          ],
        },
        search: {
          handler: this.search.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/_search",
              verb: "get",
            },
            {
              path: "device-manager/:engineId/groups/_search",
              verb: "post",
            },
          ],
        },
        addAsset: {
          handler: this.addAsset.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/:_id/addAsset",
              verb: "post",
            },
          ],
        },
        removeAsset: {
          handler: this.removeAsset.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/:_id/removeAsset",
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

  /**
   * Check that the path property is valid, and closest parent exists.
   * @param {string} engineId Engine ID
   * @param {string} path The path of a group
   * @throws {BadRequestError} If the path is not a string or if the path is not valid.
   * @returns {void}
   */
  async checkPath(
    engineId: string,
    path: GroupsBodyRequest["path"],
    groupId?: string,
  ) {
    if (typeof path !== "string") {
      throw new BadRequestError("The path property should be a string");
    }
    const groups = path.split(".");
    const lastGroup = groups.pop();
    if (groupId && lastGroup !== groupId) {
      throw new BadRequestError(
        `The last part of the path "${path}" should be the group ID "${groupId}"`,
      );
    }
    if (groups.length === 0) {
      return;
    }
    const closestParentId = groups[groups.length - 1];
    let parent;
    try {
      parent = await this.sdk.document.get<GroupContent>(
        engineId,
        InternalCollection.GROUPS,
        closestParentId,
      );
    } catch {
      throw new BadRequestError(
        `The closest parent group "${closestParentId}" does not exist`,
      );
    }
    if (!parent) {
      throw new BadRequestError(
        `The closest parent group "${closestParentId}" does not exist`,
      );
    }
    if (parent._source.path !== groups.join(".")) {
      throw new BadRequestError(`The parent path does not match`);
    }
  }

  async checkGroupName(
    engineId: string,
    name: GroupsBodyRequest["name"],
    assetId?: string,
  ) {
    if (typeof name !== "string") {
      return;
    }

    const groupsCount = await this.sdk.document.count(
      engineId,
      InternalCollection.GROUPS,
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
      },
    );

    if (groupsCount > 0) {
      throw new BadRequestError(`A group with name "${name}" already exist`);
    }
  }

  async create(request: KuzzleRequest): Promise<ApiGroupCreateResult> {
    const engineId = request.getString("engineId");
    const name = request.getBodyString("name");
    const metadata = request.getBodyObject("metadata", {});
    const body = request.getBody() as ApiGroupCreateRequest["body"];
    const model = body.model ?? null;

    const _id = request.getId({
      generator: () => NameGenerator.generateRandomName({ prefix: "group" }),
      ifMissing: "generate",
    });

    let path = body.path ?? _id;
    if (!path.includes(_id)) {
      path += `.${_id}`;
    }
    await this.checkPath(engineId, path, _id);

    await this.checkGroupName(engineId, body.name);

    if (typeof body.name !== "string") {
      throw new BadRequestError(`A group must have a name`);
    }

    return this.as(request.getUser()).document.create<GroupsBody>(
      engineId,
      InternalCollection.GROUPS,
      {
        lastUpdate: Date.now(),
        name: body.name,
        path,
        model
      },
      _id,
    );
  }

  async get(request: KuzzleRequest): Promise<ApiGroupGetResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();

<<<<<<< HEAD:lib/modules/asset/AssetsGroupsController.ts
    return this.assetsGroupsService.get(engineId, _id, request);
=======
    return this.as(request.getUser()).document.get<GroupsBody>(
      engineId,
      InternalCollection.GROUPS,
      _id,
    );
>>>>>>> fd554d5 (feat(group): separate group logic from assets):lib/modules/group/GroupsController.ts
  }

  async update(request: KuzzleRequest): Promise<ApiGroupUpdateResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody() as GroupsBodyRequest;

    await this.checkGroupName(engineId, body.name, _id);
    await this.checkPath(engineId, body.path, _id);
    const groupToUpdate = await this.sdk.document.get<GroupContent>(
      engineId,
      InternalCollection.GROUPS,
      _id,
    );
    const updatedGroup = await this.as(
      request.getUser(),
    ).document.update<GroupsBody>(
      engineId,
      InternalCollection.GROUPS,
      _id,
      {
        ...body,
        lastUpdate: Date.now(),
      },
      { source: true },
    );
    if (updatedGroup._source.path !== groupToUpdate._source.path) {
      const { hits: assets } = await this.sdk.document.search<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        {
          query: {
            regexp: {
              "groups.path": {
                value: `${groupToUpdate._source.path}.*`,
              },
            },
          },
        },
        { lang: "koncorde" },
      );

      await this.sdk.document.mUpdate(
        engineId,
        InternalCollection.ASSETS,
        assets.map((asset) => ({
          _id: asset._id,
          body: {
            groups: asset._source.groups
              .filter((grp) => grp.path !== groupToUpdate._source.path)
              .map((grp) => {
                if (grp.path.includes(groupToUpdate._source.path)) {
                  grp.path = grp.path.replace(
                    groupToUpdate._source.path,
                    updatedGroup._source.path,
                  );
                  grp.date = Date.now();
                }
                return grp;
              }),
          },
        })),
        { strict: true },
      );
      const { hits: childrenGroups } =
        await this.sdk.document.search<GroupContent>(
          engineId,
          InternalCollection.GROUPS,
          {
            query: {
              and: [
                {
                  regexp: {
                    path: {
                      value: `${groupToUpdate._source.path}.*`,
                    },
                  },
                },
                {
                  not: { equals: { path: groupToUpdate._source.path } },
                },
              ],
            },
          },
          { lang: "koncorde" },
        );

      await this.sdk.document.mUpdate(
        engineId,
        InternalCollection.GROUPS,
        childrenGroups.map((grp) => {
          grp._source.path = grp._source.path.replace(
            groupToUpdate._source.path,
            updatedGroup._source.path,
          );
          grp._source.lastUpdate = Date.now();
          return { _id: grp._id, body: grp._source };
        }),
        { strict: true },
      );
    }
    return updatedGroup;
  }

  async delete(request: KuzzleRequest): Promise<ApiGroupDeleteResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const group = await this.sdk.document.get<GroupContent>(
      engineId,
      InternalCollection.GROUPS,
      _id,
    );
    if (!group) {
      throw new BadRequestError(`The group with id "${_id}" does not exist`);
    }
    const { hits: assets } = await this.sdk.document.search<AssetContent>(
      engineId,
      InternalCollection.ASSETS,
      {
        query: {
          regexp: {
            "groups.path": {
              value: `${group._source.path}.*`,
            },
          },
        },
      },
      { lang: "koncorde" },
    );

    await this.sdk.document.mUpdate(
      engineId,
      InternalCollection.ASSETS,
      assets.map((asset) => ({
        _id: asset._id,
        body: {
          groups: asset._source.groups
            .filter((grp) => grp.path !== group._source.path)
            .map((grp) => {
              if (grp.path.includes(group._source.path)) {
                grp.path = grp.path.replace(`${group._source.path}.`, "");
                grp.date = Date.now();
              }
              return grp;
            }),
        },
      })),
      { strict: true },
    );
    const { hits: childrenGroups } =
      await this.sdk.document.search<GroupContent>(
        engineId,
        InternalCollection.GROUPS,
        {
          query: {
            regexp: {
              path: {
                value: `.*${_id}.*`,
              },
            },
          },
        },
        { lang: "koncorde" },
      );

    await this.sdk.document.mUpdate(
      engineId,
      InternalCollection.GROUPS,
      childrenGroups.map((grp) => {
        grp._source.path = grp._source.path.replace(
          `${group._source.path}.`,
          "",
        );
        grp._source.lastUpdate = Date.now();
        return { _id: grp._id, body: grp._source };
      }),
      { strict: true },
    );

    await this.as(request.getUser()).document.delete(
      engineId,
      InternalCollection.GROUPS,
      _id,
    );
  }

  async search(request: KuzzleRequest): Promise<ApiGroupSearchResult> {
    const engineId = request.getString("engineId");
    const searchParams = request.getSearchParams();

<<<<<<< HEAD:lib/modules/asset/AssetsGroupsController.ts
    return this.assetsGroupsService.search(engineId, searchParams, request);
=======
    return this.as(request.getUser()).document.search<GroupContent>(
      engineId,
      InternalCollection.GROUPS,
      searchBody,
      { from, lang, scroll, size },
    );
>>>>>>> fd554d5 (feat(group): separate group logic from assets):lib/modules/group/GroupsController.ts
  }

  async addAsset(request: KuzzleRequest): Promise<ApiGroupAddAssetsResult> {
    const engineId = request.getString("engineId");
    const body = request.getBody() as ApiGroupAddAssetsRequest["body"];
    const path = request.getBodyString("path");
    const groupId = path.split(".").pop();
    this.checkPath(engineId, path);
    if (
      !(await this.sdk.document.exists(
        engineId,
        InternalCollection.GROUPS,
        groupId,
      ))
    ) {
      throw new BadRequestError(`The group with path "${path}" does not exist`);
    }

    const { successes: assets, errors } = await this.sdk.document.mGet(
      engineId,
      InternalCollection.ASSETS,
      body.assetIds,
    );
    if (errors.length > 0) {
      throw new BadRequestError(
        `The assets with ids "${errors.join(", ")}" do not exist`,
      );
    }
    assets.map((asset) => {
      if (!Array.isArray(asset._source.groups)) {
        asset._source.groups = [];
      }

      asset._source.groups.push({
        date: Date.now(),
        path: path,
      });
      return asset;
    });

    const groupsUpdate = await this.as(
      request.getUser(),
    ).document.update<GroupsBody>(
      engineId,
      InternalCollection.GROUPS,
      groupId,
      {
        lastUpdate: Date.now(),
      },
      { source: true },
    );

    const update = await this.sdk.document.mUpdate(
      engineId,
      InternalCollection.ASSETS,
      assets.map((asset) => ({ _id: asset._id, body: asset._source })),
    );

    return {
      ...update,
      groups: groupsUpdate,
    };
  }

  async removeAsset(
    request: KuzzleRequest,
  ): Promise<ApiGroupRemoveAssetsResult> {
    const engineId = request.getString("engineId");
    const path = request.getBodyString("path");
    const body = request.getBody() as ApiGroupRemoveAssetsRequest["body"];
    this.checkPath(engineId, path);
    // ? Get document to check if really exists, even if not indexed

    const assets = [];
    for (const assetId of body.assetIds) {
      const assetContent = (
        await this.sdk.document.get<AssetContent>(
          engineId,
          InternalCollection.ASSETS,
          assetId,
        )
      )._source;

      if (!Array.isArray(assetContent.groups)) {
        continue;
      }

      assetContent.groups = assetContent.groups.filter(
        (group) => group.path !== path,
      );

      assets.push({
        _id: assetId,
        body: assetContent,
      });
    }

    const groupsUpdate = await this.as(
      request.getUser(),
    ).document.update<GroupsBody>(
      engineId,
      InternalCollection.GROUPS,
      path.split(".").pop(),
      {
        lastUpdate: Date.now(),
      },
      { source: true },
    );

    const update = await this.sdk.document.mUpdate(
      engineId,
      InternalCollection.ASSETS,
      assets,
    );
    return{
      ...update,
      groups: groupsUpdate,
    };
  }
}
