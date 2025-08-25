import {
  BadRequestError,
  ControllerDefinition,
  EmbeddedSDK,
  KuzzleError,
  KuzzleRequest,
  NameGenerator,
  User,
} from "kuzzle";

import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import {
  ApiGroupAddAssetsRequest,
  ApiGroupAddAssetsResult,
  ApiGroupAddDevicesRequest,
  ApiGroupAddDevicesResult,
  ApiGroupCreateRequest,
  ApiGroupCreateResult,
  ApiGroupDeleteResult,
  ApiGroupGetResult,
  ApiGroupListItemsResult,
  ApiGroupMCreateResult,
  ApiGroupMUpdateResult,
  ApiGroupMUpsertResult,
  ApiGroupRemoveAssetsRequest,
  ApiGroupRemoveAssetsResult,
  ApiGroupRemoveDevicesRequest,
  ApiGroupRemoveDevicesResult,
  ApiGroupSearchResult,
  ApiGroupUpdateResult,
  ApiGroupUpsertResult,
  GroupsBodyRequest,
} from "./types/GroupsApi";
import { GroupContent } from "./types/GroupContent";
import { GroupsService } from "./GroupsService";
import { Metadata } from "../shared";

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
        upsert: {
          handler: this.upsert.bind(this),
          http: [{ path: "device-manager/:engineId/groups", verb: "put" }],
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
        addAssets: {
          handler: this.addAssets.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/:_id/addAssets",
              verb: "post",
            },
          ],
        },
        removeAssets: {
          handler: this.removeAssets.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/removeAssets",
              verb: "post",
            },
          ],
        },
        addDevices: {
          handler: this.addDevices.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/addDevices",
              verb: "post",
            },
          ],
        },
        removeDevices: {
          handler: this.removeDevices.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/removeDevices",
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
        mCreate: {
          handler: this.mCreate.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/_mCreate",
              verb: "post",
            },
          ],
        },
        mUpdate: {
          handler: this.mUpdate.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/_mUpdate",
              verb: "put",
            },
          ],
        },
        mUpsert: {
          handler: this.mUpsert.bind(this),
          http: [
            {
              path: "device-manager/:engineId/groups/_mUpsert",
              verb: "put",
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

  async upsert(request: KuzzleRequest): Promise<ApiGroupUpsertResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId({
      generator: () => NameGenerator.generateRandomName({ prefix: "group" }),
      ifMissing: "generate",
    });
    const body = request.getBody() as GroupsBodyRequest;
    const name = body.name;
    let path = body.path;
    const model = body.model;
    const metadata = body.metadata;
    if (name !== undefined) {
      await this.checkGroupName(engineId, name, _id);
    }

    if (path !== undefined) {
      await this.checkPath(engineId, path, _id);
    }
    const group = await this.get(request);
    if (!group) {
      path = body.path ?? _id;
      if (!path.includes(_id)) {
        path += `.${_id}`;
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
    return this.groupsService.update(
      request,
      _id,
      engineId,
      name,
      path,
      metadata,
    );
  }

  async update(request: KuzzleRequest): Promise<ApiGroupUpdateResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody() as GroupsBodyRequest;
    const name = body.name;
    const path = body.path;
    const metadata = body.metadata;
    if (name !== undefined) {
      await this.checkGroupName(engineId, name, _id);
    }

    if (path !== undefined) {
      await this.checkPath(engineId, path, _id);
    }
    return this.groupsService.update(
      request,
      _id,
      engineId,
      name,
      path,
      metadata,
    );
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

  async addAssets(request: KuzzleRequest): Promise<ApiGroupAddAssetsResult> {
    const engineId = request.getString("engineId");
    const body = request.getBody() as ApiGroupAddAssetsRequest["body"];
    const path = request.getBodyString("path");
    const assetIds = body.assetIds;
    this.checkPath(engineId, path);
    return this.groupsService.addAssets(engineId, path, assetIds, request);
  }

  async removeAssets(
    request: KuzzleRequest,
  ): Promise<ApiGroupRemoveAssetsResult> {
    const engineId = request.getString("engineId");
    const body = request.getBody() as ApiGroupRemoveAssetsRequest["body"];
    const path = request.getBodyString("path");
    const assetIds = body.assetIds;
    this.checkPath(engineId, path);
    return this.groupsService.removeAssets(engineId, path, assetIds, request);
  }

  async addDevices(request: KuzzleRequest): Promise<ApiGroupAddDevicesResult> {
    const engineId = request.getString("engineId");
    const body = request.getBody() as ApiGroupAddDevicesRequest["body"];
    const path = request.getBodyString("path");
    const deviceIds = body.deviceIds;
    this.checkPath(engineId, path);
    return this.groupsService.addDevices(engineId, path, deviceIds, request);
  }

  async removeDevices(
    request: KuzzleRequest,
  ): Promise<ApiGroupRemoveDevicesResult> {
    const engineId = request.getString("engineId");
    const body = request.getBody() as ApiGroupRemoveDevicesRequest["body"];
    const path = request.getBodyString("path");
    const deviceIds = body.deviceIds;
    this.checkPath(engineId, path);
    return this.groupsService.removeDevices(engineId, path, deviceIds, request);
  }

  async mCreate(request: KuzzleRequest): Promise<ApiGroupMCreateResult> {
    const engineId = request.getString("engineId");
    const groups = request.getBodyArray("groups");
    const errors = [];
    const promises: Array<() => Promise<void>> = [];
    const toCreate: Array<{
      _id: string;
      metadata: Metadata;
      model: string;
      name: string;
      path: string;
    }> = [];
    for (const g of groups) {
      const name = g.name;
      const metadata = g.metadata ?? {};
      const model = g.model ?? null;

      const _id =
        g._id ?? NameGenerator.generateRandomName({ prefix: "group" });
      let path = g.path ?? _id;
      if (!path.includes(_id)) {
        path += `.${_id}`;
      }
      promises.push(async () => {
        try {
          if (typeof name !== "string") {
            throw new BadRequestError(`A group must have a name`);
          }
          await this.checkPath(engineId, path, _id);

          await this.checkGroupName(engineId, name);

          toCreate.push({ _id, metadata, model, name, path });
        } catch (error) {
          let reason: string = "";
          let status: number = 400;
          if (error instanceof KuzzleError) {
            reason = error.message;
            status = error.code;
          }
          errors.push({
            document: { _id, body: { metadata, model, name, path } },
            reason,
            status,
          });
        }
      });
    }
    await Promise.allSettled(
      promises.map((f) => new Promise((resolve) => f().then(resolve))),
    );
    const res = await this.groupsService.mCreate(engineId, toCreate);
    return {
      errors: [...res.errors, ...errors],
      successes: res.successes,
    };
  }

  async mUpdate(request: KuzzleRequest): Promise<ApiGroupMUpdateResult> {
    const engineId = request.getString("engineId");
    const groups = request.getBodyArray("groups");
    const errors = [];
    const promises: Array<() => Promise<void>> = [];
    const toUpdate: Array<{
      _id: string;
      metadata: Metadata;
      model: string;
      name: string;
      path: string;
    }> = [];
    for (const g of groups) {
      const name = g.name;
      const metadata = g.metadata ?? {};
      const model = g.model ?? null;

      const _id = g._id;
      const path = g.path;
      promises.push(async () => {
        try {
          if (typeof _id !== "string") {
            throw new BadRequestError(`A group must have an _id`);
          }
          if (name) {
            if (typeof name !== "string" || name.trim() === "") {
              throw new BadRequestError(
                `A group name must be a non-empty string`,
              );
            }
            await this.checkGroupName(engineId, name, _id);
          }

          if (path) {
            await this.checkPath(engineId, path, _id);
          }
          toUpdate.push({ _id, metadata, model, name, path });
        } catch (error) {
          let reason: string = "";
          let status: number = 400;
          if (error instanceof KuzzleError) {
            reason = error.message;
            status = error.code;
          }
          errors.push({
            document: { _id, body: { metadata, model, name, path } },
            reason,
            status,
          });
        }
      });
    }
    await Promise.allSettled(
      promises.map((f) => new Promise((resolve) => f().then(resolve))),
    );
    const res = await this.groupsService.mUpdate(engineId, toUpdate, request);
    return { errors: [...res.errors, ...errors], successes: res.successes };
  }
  async mUpsert(request: KuzzleRequest): Promise<ApiGroupMUpsertResult> {
    const engineId = request.getString("engineId");
    const groups = request.getBodyArray("groups");
    const errors = [];
    const promises: Array<() => Promise<void>> = [];
    const toUpsert: Array<{
      _id: string;
      metadata: Metadata;
      model: string;
      name: string;
      path: string;
    }> = [];
    for (const g of groups) {
      const name = g.name;
      const metadata = g.metadata ?? {};
      const model = g.model ?? null;

      const _id =
        g._id ?? NameGenerator.generateRandomName({ prefix: "group" });
      let path: string = g.path;
      promises.push(async () => {
        try {
          if (typeof _id !== "string") {
            throw new BadRequestError(`A group must have an _id`);
          }
          if (name) {
            if (typeof name !== "string" || name.trim() === "") {
              throw new BadRequestError(
                `A group name must be a non-empty string`,
              );
            }
            await this.checkGroupName(engineId, name, _id);
          }

          if (path) {
            if (!g._id) {
              path += `.${_id}`;
            }
            await this.checkPath(engineId, path, _id);
          }
          toUpsert.push({ _id, metadata, model, name, path });
        } catch (error) {
          let reason: string = "";
          let status: number = 400;
          if (error instanceof KuzzleError) {
            reason = error.message;
            status = error.code;
          }
          errors.push({
            document: { _id, body: { metadata, model, name, path } },
            reason,
            status,
          });
        }
      });
    }
    await Promise.allSettled(
      promises.map((f) => new Promise((resolve) => f().then(resolve))),
    );
    const res = await this.groupsService.mUpsert(engineId, toUpsert, request);
    return { errors: [...errors, ...res.errors], successes: res.successes };
  }
}
