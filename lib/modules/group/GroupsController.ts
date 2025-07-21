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
import {
  ApiGroupAddAssetsRequest,
  ApiGroupAddAssetsResult,
  ApiGroupAddDeviceRequest,
  ApiGroupAddDevicesResult,
  ApiGroupCreateRequest,
  ApiGroupCreateResult,
  ApiGroupDeleteResult,
  ApiGroupGetResult,
  ApiGroupListItemsResult,
  ApiGroupRemoveAssetsRequest,
  ApiGroupRemoveAssetsResult,
  ApiGroupRemoveDeviceRequest,
  ApiGroupRemoveDeviceResult,
  ApiGroupSearchResult,
  ApiGroupUpdateResult,
  GroupsBodyRequest,
} from "./types/GroupsApi";
import { GroupContent } from "./types/GroupContent";
import { AssetContent } from "../asset";
import { GroupsService } from "./GroupsService";
import { AskModelGroupGet } from "../model";
import { DeviceContent } from "../device";

export class GroupsController {
  definition: ControllerDefinition;

  constructor(
    private plugin: DeviceManagerPlugin,
    private groupsService: GroupsService,
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
              path: "device-manager/:engineId/groups/removeAsset",
              verb: "post",
            },
          ],
        },
        addDevice: {
          handler: this.addDevice.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/addDevice",
              verb: "post",
            },
          ],
        },
        removeDevice: {
          handler: this.removeDevice.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/removeDevice",
              verb: "post",
            },
          ],
        },
        listItems: {
          handler: this.listItems.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/:_id/listItems",
              verb: "get",
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

    await this.checkGroupName(engineId, name);

    if (typeof name !== "string") {
      throw new BadRequestError(`A group must have a name`);
    }
    return this.groupsService.create(
      _id,
      engineId,
      metadata,
      model,
      name,
      path,
      request,
    );
  }

  async get(request: KuzzleRequest): Promise<ApiGroupGetResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();

    return this.groupsService.get(engineId, _id, request);
  }

  async update(request: KuzzleRequest): Promise<ApiGroupUpdateResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody() as GroupsBodyRequest;
    const name = body.name;
    const path = body.path;
    const metadata = body.metadata;

    let updateRequestBody = {};

    if (name !== undefined) {
      await this.checkGroupName(engineId, name, _id);
      updateRequestBody = { ...updateRequestBody, name };
    }

    if (path !== undefined) {
      await this.checkPath(engineId, path, _id);
      updateRequestBody = { ...updateRequestBody, path };
    }

    if (metadata !== undefined) {
      const group = await this.get(request);
      const { model, metadata: groupMetadata } = group._source;
      if (model !== null) {
        const groupModel = await ask<AskModelGroupGet>(
          "ask:device-manager:model:group:get",
          { model },
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

    const groupToUpdate = await this.sdk.document.get<GroupContent>(
      engineId,
      InternalCollection.GROUPS,
      _id,
    );
    const updatedGroup = await this.groupsService.update(
      request,
      _id,
      engineId,
      updateRequestBody,
    );

    if (updatedGroup._source.path !== groupToUpdate._source.path) {
      const { hits: assets } = await this.sdk.document.search<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        {
          query: {
            prefix: {
              "groups.path": {
                value: groupToUpdate._source.path,
              },
            },
          },
        },
        { lang: "koncorde" },
      );
      const { hits: devices } = await this.sdk.document.search<DeviceContent>(
        engineId,
        InternalCollection.DEVICES,
        {
          query: {
            prefix: {
              "groups.path": {
                value: groupToUpdate._source.path,
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
            groups: asset._source.groups.map((grp) => {
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
      await this.sdk.document.mUpdate(
        engineId,
        InternalCollection.DEVICES,
        devices.map((device) => ({
          _id: device._id,
          body: {
            groups: device._source.groups.map((grp) => {
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
                  prefix: {
                    path: {
                      value: groupToUpdate._source.path,
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
    await this.groupsService.delete(_id, engineId, request);
  }

  async search(request: KuzzleRequest): Promise<ApiGroupSearchResult> {
    const engineId = request.getString("engineId");
    const searchParams = request.getSearchParams();
    return this.groupsService.search(engineId, searchParams, request);
  }

  async listItems(request: KuzzleRequest): Promise<ApiGroupListItemsResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const includeChildren = request.getBodyBoolean("includeChildren");
    const searchParams = request.getSearchParams();
    const { from, size } = searchParams;
    return this.groupsService.listItems(
      engineId,
      _id,
      includeChildren,
      { from, size },
      request,
    );
  }

  async addAsset(request: KuzzleRequest): Promise<ApiGroupAddAssetsResult> {
    const engineId = request.getString("engineId");
    const body = request.getBody() as ApiGroupAddAssetsRequest["body"];
    const path = request.getBodyString("path");
    const assetIds = body.assetIds;
    this.checkPath(engineId, path);
    return this.groupsService.addAsset(engineId, path, assetIds, request);
  }

  async removeAsset(
    request: KuzzleRequest,
  ): Promise<ApiGroupRemoveAssetsResult> {
    const engineId = request.getString("engineId");
    const body = request.getBody() as ApiGroupRemoveAssetsRequest["body"];
    const path = request.getBodyString("path");
    const assetIds = body.assetIds;
    this.checkPath(engineId, path);
    return this.groupsService.removeAsset(engineId, path, assetIds, request);
  }

  async addDevice(request: KuzzleRequest): Promise<ApiGroupAddDevicesResult> {
    const engineId = request.getString("engineId");
    const body = request.getBody() as ApiGroupAddDeviceRequest["body"];
    const path = request.getBodyString("path");
    const deviceIds = body.deviceIds;
    this.checkPath(engineId, path);
    return this.groupsService.addDevice(engineId, path, deviceIds, request);
  }

  async removeDevice(
    request: KuzzleRequest,
  ): Promise<ApiGroupRemoveDeviceResult> {
    const engineId = request.getString("engineId");
    const body = request.getBody() as ApiGroupRemoveDeviceRequest["body"];
    const path = request.getBodyString("path");
    const deviceIds = body.deviceIds;
    this.checkPath(engineId, path);
    return this.groupsService.removeDevice(engineId, path, deviceIds, request);
  }
}
