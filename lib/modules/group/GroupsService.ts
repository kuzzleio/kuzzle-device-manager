import { JSONObject, KDocument } from "kuzzle-sdk";
import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import { BaseService, SearchParams } from "../shared";
import { BadRequestError, KuzzleRequest } from "kuzzle";

import { AskModelGroupGet, GroupModelContent } from "../model";
import { ask } from "kuzzle-plugin-commons";
import { AssetContent } from "../asset/types/AssetContent";
import { GroupContent } from "./exports";
import { DeviceContent } from "../device";

export class GroupsService extends BaseService {
  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);
  }

  async create(
    _id: string,
    engineId: string,
    metadata: JSONObject,
    model: string,
    name: string,
    path: string,
    request: KuzzleRequest,
  ): Promise<KDocument<GroupContent>> {
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
    const group: KDocument<GroupContent> = {
      _id,
      _source: {
        lastUpdate: Date.now(),
        metadata: { ...groupMetadata },
        model,
        name,
        path,
      },
    };
    return this.createDocument<GroupContent>(request, group, {
      collection: InternalCollection.GROUPS,
      engineId,
    });
  }

  async get(engineId: string, _id: string, request: KuzzleRequest) {
    return this.getDocument<GroupContent>(request, _id, {
      collection: InternalCollection.GROUPS,
      engineId,
    });
  }

  async update(
    request: KuzzleRequest,
    _id: string,
    engineId: string,
    updateContent: JSONObject,
  ) {
    const updatedGroup = await this.updateDocument<GroupContent>(
      request,
      {
        _id,
        _source: { ...updateContent, lastUpdate: Date.now() },
      },
      { collection: InternalCollection.GROUPS, engineId },
      { source: true, triggerEvents: true },
    );

    return updatedGroup;
  }

  async delete(_id: string, engineId: string, request: KuzzleRequest) {
    const group = await this.get(engineId, _id, request);
    if (!group) {
      throw new BadRequestError(`The group with id "${_id}" does not exist`);
    }
    const { hits: assets } = await this.sdk.document.search<AssetContent>(
      engineId,
      InternalCollection.ASSETS,
      {
        query: {
          prefix: {
            "groups.path": {
              value: group._source.path,
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
            prefix: {
              path: {
                value: _id,
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

    return this.deleteDocument(request, _id, {
      collection: InternalCollection.GROUPS,
      engineId,
    });
  }
  async search(
    engineId: string,
    searchParams: SearchParams,
    request: KuzzleRequest,
  ) {
    return this.searchDocument<GroupContent>(request, searchParams, {
      collection: InternalCollection.GROUPS,
      engineId,
    });
  }

  async listItems(
    engineId: string,
    _id: string,
    includeChildren: boolean,
    options: { from?: number; size?: number },
    request: KuzzleRequest,
  ) {
    const group = await this.get(engineId, _id, request);
    if (!group) {
      throw new BadRequestError(`The group with _id "${_id}" does not exist`);
    }
    /*     let model: GroupModelContent;
    if (group._source.model) {
      model = await ask<AskModelGroupGet>(
        "ask:device-manager:model:group:get",
        { model: group._source.model },
      );
    } */
    const body = includeChildren
      ? {
          query: {
            prefix: {
              "groups.path": {
                value: group._source.path,
              },
            },
          },
        }
      : {
          query: {
            term: {
              "groups.path": group._source.path,
            },
          },
        };
    const { hits: assetHits } = await this.sdk.document.search<AssetContent>(
      engineId,
      InternalCollection.ASSETS,
      body,
      options,
    );
    const { hits: deviceHits } = await this.sdk.document.search<DeviceContent>(
      engineId,
      InternalCollection.DEVICES,
      body,
      options,
    );
    return {
      assets: assetHits,
      devices: deviceHits,
    };
  }

  async addAsset(
    engineId: string,
    path: string,
    assetIds: string[],
    request: KuzzleRequest,
  ) {
    const _id = path.split(".").pop();
    const group = await this.sdk.document.get<GroupContent>(
      engineId,
      InternalCollection.GROUPS,
      _id,
    );

    if (!group) {
      throw new BadRequestError(`The group with path "${path}" does not exist`);
    }
    let model: GroupModelContent;
    if (group._source.model) {
      model = await ask<AskModelGroupGet>(
        "ask:device-manager:model:group:get",
        { model: group._source.model },
      );
    }
    if (model && !model.group.affinity.type.includes("assets")) {
      throw new BadRequestError(
        `The group ${group._id} of model ${group._source.model} can not contain assets`,
      );
    }

    const { successes: assets, errors } =
      await this.sdk.document.mGet<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        assetIds,
      );

    if (errors.length > 0) {
      throw new BadRequestError(
        `The assets with ids "${errors.join(", ")}" do not exist`,
      );
    }
    if (model && model.group.affinity.strict) {
      for (const asset of assets) {
        if (!model.group.affinity.models.assets.includes(asset._source.model)) {
          throw new BadRequestError(
            `Groups of model ${group._source.model} can not contain assets of model ${asset._source.model}`,
          );
        }
      }
    }
    const assetsToUpdate = assets.map((asset) => {
      if (!Array.isArray(asset._source.groups)) {
        asset._source.groups = [];
      }

      asset._source.groups.push({
        date: Date.now(),
        path: path,
      });
      return asset;
    });

    const groupUpdate = await this.update(request, _id, engineId, {
      lastUpdate: Date.now(),
    });

    const update = await this.sdk.document.mReplace(
      engineId,
      InternalCollection.ASSETS,
      assetsToUpdate.map((asset) => ({ _id: asset._id, body: asset._source })),
      { triggerEvents: true },
    );

    return {
      ...update,
      group: groupUpdate,
    };
  }
  async removeAsset(
    engineId: string,
    path: string,
    assetIds: string[],
    request: KuzzleRequest,
  ) {
    const _id = path.split(".").pop();
    if (
      !(await this.sdk.document.exists(
        engineId,
        InternalCollection.GROUPS,
        _id,
      ))
    ) {
      throw new BadRequestError(`The group with path "${path}" does not exist`);
    }
    const { successes: assets, errors } =
      await this.sdk.document.mGet<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        assetIds,
      );
    if (errors.length > 0) {
      throw new BadRequestError(
        `The assets with ids "${errors.join(", ")}" do not exist`,
      );
    }
    const assetsToUpdate = assets.map((asset) => {
      asset._source.groups = asset._source.groups.filter(
        (grp) => grp.path !== path,
      );
      return asset;
    });

    const groupUpdate = await this.update(request, _id, engineId, {
      lastUpdate: Date.now(),
    });

    const update = await this.sdk.document.mReplace(
      engineId,
      InternalCollection.ASSETS,
      assetsToUpdate.map((asset) => ({ _id: asset._id, body: asset._source })),
      { triggerEvents: true },
    );

    return {
      ...update,
      group: groupUpdate,
    };
  }
  async addDevice(
    engineId: string,
    path: string,
    deviceIds: string[],
    request: KuzzleRequest,
  ) {
    const _id = path.split(".").pop();
    const group = await this.sdk.document.get<GroupContent>(
      engineId,
      InternalCollection.GROUPS,
      _id,
    );

    if (!group) {
      throw new BadRequestError(`The group with path "${path}" does not exist`);
    }
    let model: GroupModelContent;
    if (group._source.model) {
      model = await ask<AskModelGroupGet>(
        "ask:device-manager:model:group:get",
        { model: group._source.model },
      );
    }
    if (model && !model.group.affinity.type.includes("devices")) {
      throw new BadRequestError(
        `The group ${group._id} of model ${group._source.model} can not contain devices`,
      );
    }

    const { successes: devices, errors } =
      await this.sdk.document.mGet<DeviceContent>(
        engineId,
        InternalCollection.DEVICES,
        deviceIds,
      );

    if (errors.length > 0) {
      throw new BadRequestError(
        `The devices with ids "${errors.join(", ")}" do not exist`,
      );
    }
    if (model && model.group.affinity.strict) {
      for (const device of devices) {
        if (
          !model.group.affinity.models.devices.includes(device._source.model)
        ) {
          throw new BadRequestError(
            `Groups of model ${group._source.model} can not contain devices of model ${device._source.model}`,
          );
        }
      }
    }
    const devicesToUpdate = devices.map((device) => {
      if (!Array.isArray(device._source.groups)) {
        device._source.groups = [];
      }

      device._source.groups.push({
        date: Date.now(),
        path: path,
      });
      return device;
    });

    const groupUpdate = await this.update(request, _id, engineId, {
      lastUpdate: Date.now(),
    });

    const update = await this.sdk.document.mReplace(
      engineId,
      InternalCollection.DEVICES,
      devicesToUpdate.map((device) => ({
        _id: device._id,
        body: device._source,
      })),
      { triggerEvents: true },
    );

    return {
      ...update,
      group: groupUpdate,
    };
  }
  async removeDevice(
    engineId: string,
    path: string,
    deviceIds: string[],
    request: KuzzleRequest,
  ) {
    const _id = path.split(".").pop();
    if (
      !(await this.sdk.document.exists(
        engineId,
        InternalCollection.GROUPS,
        _id,
      ))
    ) {
      throw new BadRequestError(`The group with path "${path}" does not exist`);
    }
    const { successes: devices, errors } =
      await this.sdk.document.mGet<DeviceContent>(
        engineId,
        InternalCollection.DEVICES,
        deviceIds,
      );
    if (errors.length > 0) {
      throw new BadRequestError(
        `The devices with ids "${errors.join(", ")}" do not exist`,
      );
    }
    const devicesToUpdate = devices.map((device) => {
      device._source.groups = device._source.groups.filter(
        (grp) => grp.path !== path,
      );
      return device;
    });

    const groupUpdate = await this.update(request, _id, engineId, {
      lastUpdate: Date.now(),
    });

    const update = await this.sdk.document.mReplace(
      engineId,
      InternalCollection.DEVICES,
      devicesToUpdate.map((device) => ({
        _id: device._id,
        body: device._source,
      })),
      { triggerEvents: true },
    );

    return {
      ...update,
      group: groupUpdate,
    };
  }
}
