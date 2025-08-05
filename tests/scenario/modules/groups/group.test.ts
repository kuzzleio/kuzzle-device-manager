import { KDocument } from "kuzzle-sdk";
import {
  groupTestId,
  groupTestBody,
  groupTestParentId1,
  groupTestParentBody1,
  groupTestChildrenId1,
  groupTestChildrenBody1,
  groupChildrenWithAssetId,
  groupParentWithAssetId,
  groupTestParentId2,
} from "../../../fixtures/groups";

// Lib
import {
  ApiGroupCreateRequest,
  ApiGroupCreateResult,
  ApiGroupDeleteRequest,
  ApiGroupGetRequest,
  ApiGroupSearchRequest,
  ApiGroupSearchResult,
  ApiGroupUpdateRequest,
  ApiGroupAddAssetsRequest,
  ApiGroupAddAssetsResult,
  ApiGroupRemoveAssetsRequest,
  ApiGroupRemoveAssetsResult,
  ApiGroupAddDeviceRequest,
  ApiGroupAddDevicesResult,
  ApiGroupRemoveDeviceRequest,
  ApiGroupRemoveDeviceResult,
  ApiGroupListItemsRequest,
  ApiGroupListItemsResult,
  ApiGroupMCreateRequest,
  ApiGroupMCreateResult,
  ApiGroupMUpdateRequest,
  ApiGroupMUpdateResult,
  ApiGroupMUpsertRequest,
  ApiGroupMUpsertResult,
} from "../../../../lib/modules/group/types/GroupsApi";
import { AssetContent } from "../../../../lib/modules/asset/exports";
import { InternalCollection } from "../../../../lib/modules/plugin";
import { setupHooks } from "../../../helpers";
import { GroupContent } from "lib/modules/group/types/GroupContent";
import {
  assetAyseDebug1Id,
  deviceAyseLinked2Id,
  deviceAyseWarehouseId,
} from "../../../fixtures";
import { DeviceContent } from "lib/modules/device";
import { toLower } from "lodash";

jest.setTimeout(10000);

describe("GroupsController", () => {
  const sdk = setupHooks();
  const now = Date.now();

  it("can create a group", async () => {
    const missingBodyQuery: Omit<ApiGroupCreateRequest, "body"> = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "create",
      _id: "root-group",
    };
    await expect(sdk.query(missingBodyQuery)).rejects.toThrow(
      /^The request must specify a body.$/,
    );

    const missingNameQuery = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "create",
      body: {},
    };
    await expect(sdk.query(missingNameQuery)).rejects.toThrow(
      'Missing argument "body.name".',
    );

    const badParentIdQuery: ApiGroupCreateRequest = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "create",
      body: {
        name: "Parent not exist",
        path: "parent-not-exist",
      },
    };
    await expect(sdk.query(badParentIdQuery)).rejects.toThrow(
      'The closest parent group "parent-not-exist" does not exist',
    );

    const duplicateGroupName: ApiGroupCreateRequest = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "create",
      body: {
        name: "test group",
        path: undefined,
      },
    };
    await expect(sdk.query(duplicateGroupName)).rejects.toThrow(
      /^A group with name "test group" already exist$/,
    );

    const { result: groupRoot } = await sdk.query<
      ApiGroupCreateRequest,
      ApiGroupCreateResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "create",
      _id: "root-group",
      body: {
        name: "root group",
        path: undefined,
      },
    });

    expect(groupRoot._id).toBe("root-group");
    expect(groupRoot._source).toMatchObject({
      name: "root group",
    });
    expect(groupRoot._source.lastUpdate).toBeGreaterThanOrEqual(now);

    const { result: assetGroupChildren } = await sdk.query<
      ApiGroupCreateRequest,
      ApiGroupCreateResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "create",
      _id: "children-group",
      body: {
        name: "children group",
        path: "root-group",
      },
    });

    expect(assetGroupChildren._id).toBe("children-group");
    expect(assetGroupChildren._source).toMatchObject({
      name: "children group",
      path: "root-group.children-group",
    });
    expect(assetGroupChildren._source.lastUpdate).toBeGreaterThanOrEqual(now);

    const { result: assetGroupWithoutIdSpecified } = await sdk.query<
      ApiGroupCreateRequest,
      ApiGroupCreateResult
    >({
      controller: "device-manager/groups",
      action: "create",
      engineId: "engine-ayse",
      body: {
        name: "group",
        path: undefined,
      },
    });

    expect(typeof assetGroupWithoutIdSpecified._id).toBe("string");
  });

  it("can get a group", async () => {
    const missingIdQuery: Omit<ApiGroupGetRequest, "_id"> = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "get",
    };
    await expect(sdk.query(missingIdQuery)).rejects.toThrow(
      /^Missing argument "_id".$/,
    );

    const { result } = await sdk.query<ApiGroupGetRequest>({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "get",
      _id: groupTestId,
    });

    expect(result._id).toEqual(groupTestId);
    expect(result._source).toMatchObject(groupTestBody);
  });

  it("can update a group", async () => {
    const missingIdQuery: Omit<ApiGroupUpdateRequest, "_id"> = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "update",
      body: groupTestBody,
    };
    await expect(sdk.query(missingIdQuery)).rejects.toThrow(
      /^Missing argument "_id".$/,
    );

    const missingBodyQuery: Omit<ApiGroupUpdateRequest, "body"> = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "update",
      _id: groupTestId,
    };
    await expect(sdk.query(missingBodyQuery)).rejects.toThrow(
      /^The request must specify a body.$/,
    );

    const badParentIdQuery: ApiGroupUpdateRequest = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "update",
      _id: groupTestId,
      body: {
        name: "root group",
        path: "not-exist." + groupTestId,
      },
    };
    await expect(sdk.query(badParentIdQuery)).rejects.toThrow(
      'The closest parent group "not-exist" does not exist',
    );

    const duplicateGroupName: ApiGroupUpdateRequest = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "update",
      _id: groupTestParentId1,
      body: {
        name: "test group",
        path: groupTestParentId1,
      },
    };
    await expect(sdk.query(duplicateGroupName)).rejects.toThrow(
      /^A group with name "test group" already exist$/,
    );

    const { result } = await sdk.query<ApiGroupUpdateRequest>({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "update",
      _id: groupTestId,
      body: {
        name: "root group",
        path: groupTestId,
      },
    });

    expect(result._id).toEqual(groupTestId);
    expect(result._source).toMatchObject({
      name: "root group",
      path: groupTestId,
    });
    expect(result._source.lastUpdate).toBeGreaterThanOrEqual(now);
  });
  it("can delete a group", async () => {
    const missingIdQuery: Omit<ApiGroupDeleteRequest, "_id"> = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "delete",
    };
    await expect(sdk.query(missingIdQuery)).rejects.toThrow(
      /^Missing argument "_id".$/,
    );

    const { error, status } = await sdk.query<ApiGroupDeleteRequest>({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "delete",
      _id: groupTestId,
    });

    expect(error).toBeNull();
    expect(status).toBe(200);

    await sdk.query<ApiGroupDeleteRequest>({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "delete",
      _id: groupTestParentId1,
    });

    const { _source: childrenGroup } = await sdk.document.get<GroupContent>(
      "engine-ayse",
      InternalCollection.GROUPS,
      groupTestChildrenId1,
    );

    expect(childrenGroup).toMatchObject({
      path: groupTestChildrenId1,
    });
    expect(childrenGroup.lastUpdate).toBeGreaterThanOrEqual(now);

    await sdk.query<ApiGroupDeleteRequest>({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "delete",
      _id: groupParentWithAssetId,
    });

    const { _source: assetGrouped } = await sdk.document.get<AssetContent>(
      "engine-ayse",
      InternalCollection.ASSETS,
      "Container-grouped",
    );

    expect(assetGrouped).toMatchObject({
      groups: [
        {
          path: groupChildrenWithAssetId,
        },
      ],
    });
  });

  it("can search groups", async () => {
    const { result } = await sdk.query<ApiGroupSearchRequest>({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "search",
      body: {
        query: {
          ids: {
            values: [groupTestId, groupTestParentId1, groupTestChildrenId1],
          },
        },
      },
      lang: "koncorde",
    });

    const hits: ApiGroupSearchResult["hits"] = [
      {
        _id: groupTestId,
        _score: 1,
        _source: groupTestBody,
      },
      {
        _id: groupTestParentId1,
        _score: 1,
        _source: groupTestParentBody1,
      },
      {
        _id: groupTestChildrenId1,
        _score: 1,
        _source: groupTestChildrenBody1,
      },
    ];

    expect(result).toMatchObject({
      fetched: hits.length,
      hits,
      total: hits.length,
    });
  });

  it("can add asset to a group", async () => {
    const missingBodyQuery: Omit<ApiGroupAddAssetsRequest, "body"> = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addAsset",
    };
    await expect(sdk.query(missingBodyQuery)).rejects.toThrow(
      /^The request must specify a body.$/,
    );

    const badIdQuery: ApiGroupAddAssetsRequest = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addAsset",
      body: {
        path: "bad-id",
        assetIds: ["Container-linked1"],
      },
    };
    await expect(sdk.query(badIdQuery)).rejects.toThrow(
      'Document "bad-id" not found in "engine-ayse":"groups".',
    );

    const { result } = await sdk.query<
      ApiGroupAddAssetsRequest,
      ApiGroupAddAssetsResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addAsset",
      body: {
        path: groupTestId,
        assetIds: ["Container-linked1", "Container-linked2"],
      },
    });

    expect(result.errors).toHaveLength(0);

    expect(result.successes).toMatchObject([
      {
        _id: "Container-linked1",
        _source: {
          groups: [
            {
              path: groupTestId,
            },
          ],
        },
      },
      {
        _id: "Container-linked2",
        _source: {
          groups: [
            {
              path: groupTestId,
            },
          ],
        },
      },
    ]);

    // ? Dates should be separately because is not really predictable
    const assets = result.successes as KDocument<AssetContent>[];
    expect(assets[0]._source.groups[0].date).toBeGreaterThan(now);
    expect(assets[1]._source.groups[0].date).toBeGreaterThan(now);

    expect(result.group._source.lastUpdate).toBeGreaterThan(now);

    // Add assets in an second group
    const { result: result2 } = await sdk.query<
      ApiGroupAddAssetsRequest,
      ApiGroupAddAssetsResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addAsset",
      body: {
        path: groupTestParentId1,
        assetIds: ["Container-linked1", "Container-linked2"],
      },
    });

    expect(result2.errors).toHaveLength(0);

    expect(result2.successes).toMatchObject([
      {
        _id: "Container-linked1",
        _source: {
          groups: [
            {
              path: groupTestId,
            },
            {
              path: groupTestParentId1,
            },
          ],
        },
      },
      {
        _id: "Container-linked2",
        _source: {
          groups: [
            {
              path: groupTestId,
            },
            {
              path: groupTestParentId1,
            },
          ],
        },
      },
    ]);

    // ? Dates should be separately because is not really predictable
    const assets2 = result2.successes as KDocument<AssetContent>[];
    expect(assets2[0]._source.groups[0].date).toBeLessThan(Date.now());
    expect(assets2[0]._source.groups[1].date).toBeGreaterThan(now);

    expect(assets2[1]._source.groups[0].date).toBeLessThan(Date.now());
    expect(assets2[1]._source.groups[1].date).toBeGreaterThan(now);

    expect(result2.group._source.lastUpdate).toBeGreaterThan(now);

    // Add an asset to a subgroup also add the reference of the parent group
    const { result: result3 } = await sdk.query<
      ApiGroupAddAssetsRequest,
      ApiGroupAddAssetsResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addAsset",
      body: {
        path: groupTestParentId1 + "." + groupTestChildrenId1,
        assetIds: ["Container-unlinked1"],
      },
    });

    expect(result3.errors).toHaveLength(0);

    expect(result3.successes).toMatchObject([
      {
        _id: "Container-unlinked1",
        _source: {
          groups: [
            {
              path: groupTestParentId1 + "." + groupTestChildrenId1,
            },
          ],
        },
      },
    ]);

    // ? Dates should be separately because is not really predictable
    const assets3 = result3.successes as KDocument<AssetContent>[];
    expect(assets3[0]._source.groups[0].date).toBeGreaterThan(now);

    expect(result3.group._source.lastUpdate).toBeGreaterThan(now);

    const restrictedGroup: ApiGroupAddAssetsRequest = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addAsset",
      body: {
        path: groupTestParentId2,
        assetIds: ["Container-linked1"],
      },
    };
    await expect(sdk.query(restrictedGroup)).rejects.toThrow(
      `The group ${groupTestParentId2} of model DeviceRestricted can not contain assets`,
    );

    const wrongAssetModel: ApiGroupAddAssetsRequest = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addAsset",
      body: {
        path: groupTestId,
        assetIds: [assetAyseDebug1Id],
      },
    };
    await expect(sdk.query(wrongAssetModel)).rejects.toThrow(
      `Groups of model AssetRestricted can not contain assets of model MagicHouse`,
    );
  });

  it("can remove asset from group", async () => {
    const missingPathQuery: Omit<ApiGroupRemoveAssetsRequest, "body"> & {
      body: {
        assetIds: string[];
      };
    } = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "removeAsset",
      body: {
        assetIds: ["Container-grouped"],
      },
    };
    await expect(sdk.query(missingPathQuery)).rejects.toThrow(
      /^Missing argument "body.path".$/,
    );

    const missingBodyQuery: Omit<ApiGroupRemoveAssetsRequest, "body"> = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "removeAsset",
    };
    await expect(sdk.query(missingBodyQuery)).rejects.toThrow(
      /^The request must specify a body.$/,
    );

    const badIdQuery: ApiGroupRemoveAssetsRequest = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "removeAsset",
      body: {
        path: "bad-path",
        assetIds: [],
      },
    };
    await expect(sdk.query(badIdQuery)).rejects.toThrow(
      'The group with path "bad-path" does not exist',
    );

    const { result } = await sdk.query<
      ApiGroupRemoveAssetsRequest,
      ApiGroupRemoveAssetsResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "removeAsset",
      body: {
        path: groupParentWithAssetId + "." + groupChildrenWithAssetId,
        assetIds: ["Container-grouped"],
      },
    });

    expect(result.errors).toHaveLength(0);

    expect(result.successes[0]).toMatchObject({
      _id: "Container-grouped",
      _source: {
        groups: [],
      },
    });

    expect(result.group._source.lastUpdate).toBeGreaterThan(now);

    const { result: result2 } = await sdk.query<
      ApiGroupRemoveAssetsRequest,
      ApiGroupRemoveAssetsResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "removeAsset",
      body: {
        path: groupParentWithAssetId,
        assetIds: ["Container-grouped2"],
      },
    });

    expect(result2.errors).toHaveLength(0);

    expect(result2.successes[0]).toMatchObject({
      _id: "Container-grouped2",
      _source: {
        groups: [],
      },
    });

    expect(result2.group._source.lastUpdate).toBeGreaterThan(now);
  });

  it("can add device to a group", async () => {
    const missingBodyQuery: Omit<ApiGroupAddDeviceRequest, "body"> = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addDevice",
    };
    await expect(sdk.query(missingBodyQuery)).rejects.toThrow(
      /^The request must specify a body.$/,
    );

    const badIdQuery: ApiGroupAddDeviceRequest = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addDevice",
      body: {
        path: "bad-id",
        deviceIds: ["DummyTemp-linked1"],
      },
    };
    await expect(sdk.query(badIdQuery)).rejects.toThrow(
      'Document "bad-id" not found in "engine-ayse":"groups".',
    );

    const { result } = await sdk.query<
      ApiGroupAddDeviceRequest,
      ApiGroupAddDevicesResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addDevice",
      body: {
        path: groupParentWithAssetId,
        deviceIds: ["DummyTemp-unlinked1", "DummyTemp-unlinked2"],
      },
    });

    expect(result.errors).toHaveLength(0);

    expect(result.successes).toMatchObject([
      {
        _id: "DummyTemp-unlinked1",
        _source: {
          groups: [
            {
              path: groupParentWithAssetId,
            },
          ],
        },
      },
      {
        _id: "DummyTemp-unlinked2",
        _source: {
          groups: [
            {
              path: groupParentWithAssetId,
            },
          ],
        },
      },
    ]);

    // ? Dates should be separately because is not really predictable
    const devices = result.successes as KDocument<DeviceContent>[];
    expect(devices[0]._source.groups[0].date).toBeGreaterThan(now);
    expect(devices[1]._source.groups[0].date).toBeGreaterThan(now);

    expect(result.group._source.lastUpdate).toBeGreaterThan(now);

    // Add devices in an second group
    const { result: result2 } = await sdk.query<
      ApiGroupAddDeviceRequest,
      ApiGroupAddDevicesResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addDevice",
      body: {
        path: groupTestParentId1,
        deviceIds: ["DummyTemp-unlinked1", "DummyTemp-unlinked2"],
      },
    });

    expect(result2.errors).toHaveLength(0);

    expect(result2.successes).toMatchObject([
      {
        _id: "DummyTemp-unlinked1",
        _source: {
          groups: [
            {
              path: groupParentWithAssetId,
            },
            {
              path: groupTestParentId1,
            },
          ],
        },
      },
      {
        _id: "DummyTemp-unlinked2",
        _source: {
          groups: [
            {
              path: groupParentWithAssetId,
            },
            {
              path: groupTestParentId1,
            },
          ],
        },
      },
    ]);

    // ? Dates should be separately because is not really predictable
    const devices2 = result2.successes as KDocument<DeviceContent>[];
    expect(devices2[0]._source.groups[0].date).toBeLessThan(Date.now());
    expect(devices2[0]._source.groups[1].date).toBeGreaterThan(now);

    expect(devices2[1]._source.groups[0].date).toBeLessThan(Date.now());
    expect(devices2[1]._source.groups[1].date).toBeGreaterThan(now);

    expect(result2.group._source.lastUpdate).toBeGreaterThan(now);

    // Add an device to a subgroup also add the reference of the parent group
    const { result: result3 } = await sdk.query<
      ApiGroupAddDeviceRequest,
      ApiGroupAddDevicesResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addDevice",
      body: {
        path: groupTestParentId1 + "." + groupTestChildrenId1,
        deviceIds: ["DummyTempPosition-linked2"],
      },
    });

    expect(result3.errors).toHaveLength(0);

    expect(result3.successes).toMatchObject([
      {
        _id: "DummyTempPosition-linked2",
        _source: {
          groups: [
            {
              path: groupParentWithAssetId,
            },
            {
              path: groupTestParentId1 + "." + groupTestChildrenId1,
            },
          ],
        },
      },
    ]);

    // ? Dates should be separately because is not really predictable
    const devices3 = result3.successes as KDocument<DeviceContent>[];
    expect(devices3[0]._source.groups[1].date).toBeGreaterThan(now);

    expect(result3.group._source.lastUpdate).toBeGreaterThan(now);

    const restrictedGroup: ApiGroupAddDeviceRequest = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addDevice",
      body: {
        path: groupTestId,
        deviceIds: ["DummyTempPosition-unlinked3"],
      },
    };
    await expect(sdk.query(restrictedGroup)).rejects.toThrow(
      `The group ${groupTestId} of model AssetRestricted can not contain devices`,
    );

    const wrongDeviceModel: ApiGroupAddDeviceRequest = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "addDevice",
      body: {
        path: groupTestParentId2,
        deviceIds: ["DummyTempPosition-unlinked3"],
      },
    };
    await expect(sdk.query(wrongDeviceModel)).rejects.toThrow(
      `Groups of model DeviceRestricted can not contain devices of model DummyTempPosition`,
    );
  });

  it("can remove device from group", async () => {
    const missingPathQuery: Omit<ApiGroupRemoveDeviceRequest, "body"> & {
      body: {
        deviceIds: string[];
      };
    } = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "removeDevice",
      body: {
        deviceIds: [deviceAyseWarehouseId],
      },
    };
    await expect(sdk.query(missingPathQuery)).rejects.toThrow(
      /^Missing argument "body.path".$/,
    );

    const missingBodyQuery: Omit<ApiGroupRemoveDeviceRequest, "body"> = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "removeDevice",
    };
    await expect(sdk.query(missingBodyQuery)).rejects.toThrow(
      /^The request must specify a body.$/,
    );

    const badIdQuery: ApiGroupRemoveDeviceRequest = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "removeDevice",
      body: {
        path: "bad-path",
        deviceIds: [],
      },
    };
    await expect(sdk.query(badIdQuery)).rejects.toThrow(
      'The group with path "bad-path" does not exist',
    );

    const { result } = await sdk.query<
      ApiGroupRemoveDeviceRequest,
      ApiGroupRemoveDeviceResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "removeDevice",
      body: {
        path: groupParentWithAssetId + "." + groupChildrenWithAssetId,
        deviceIds: [deviceAyseWarehouseId],
      },
    });

    expect(result.errors).toHaveLength(0);

    expect(result.successes[0]).toMatchObject({
      _id: deviceAyseWarehouseId,
      _source: {
        groups: [],
      },
    });

    expect(result.group._source.lastUpdate).toBeGreaterThan(now);

    const { result: result2 } = await sdk.query<
      ApiGroupRemoveDeviceRequest,
      ApiGroupRemoveDeviceResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "removeDevice",
      body: {
        path: groupParentWithAssetId,
        deviceIds: [deviceAyseLinked2Id],
      },
    });

    expect(result2.errors).toHaveLength(0);

    expect(result2.successes[0]).toMatchObject({
      _id: deviceAyseLinked2Id,
      _source: {
        groups: [],
      },
    });

    expect(result2.group._source.lastUpdate).toBeGreaterThan(now);
  });

  it("can list the items of a group", async () => {
    const { result } = await sdk.query<
      ApiGroupListItemsRequest,
      ApiGroupListItemsResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "listItems",
      _id: groupParentWithAssetId,
      body: {},
    });
    expect(result.assets.hits).toHaveLength(1);
    expect(result.assets.total).toBe(1);
    expect(result.assets.hits[0]).toMatchObject({
      _id: "Container-grouped2",
      _source: {
        groups: [{ path: groupParentWithAssetId }],
      },
    });
    expect(result.devices.hits).toHaveLength(1);
    expect(result.devices.total).toBe(1);
    expect(result.devices.hits[0]).toMatchObject({
      _id: "DummyTempPosition-linked2",
      _source: {
        groups: [{ path: groupParentWithAssetId }],
      },
    });
    const { result: resWithChildren } = await sdk.query<
      ApiGroupListItemsRequest,
      ApiGroupListItemsResult
    >({
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "listItems",
      _id: groupParentWithAssetId,
      body: { includeChildren: true },
    });
    expect(resWithChildren.assets.hits).toHaveLength(2);
    expect(resWithChildren.assets.total).toBe(2);

    expect(resWithChildren.assets.hits[0]).toMatchObject({
      _id: "Container-grouped",
      _source: {
        groups: [
          { path: groupParentWithAssetId + "." + groupChildrenWithAssetId },
        ],
      },
    });
    expect(resWithChildren.devices.hits).toHaveLength(2);
    expect(resWithChildren.devices.total).toBe(2);
    expect(resWithChildren.devices.hits[1]).toMatchObject({
      _id: "DummyTempPosition-warehouse",
      _source: {
        groups: [
          { path: groupParentWithAssetId + "." + groupChildrenWithAssetId },
        ],
      },
    });
  });

  it("can create multiple groups at once", async () => {
    const queryWithError: ApiGroupMCreateRequest = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "mCreate",
      body: {
        groups: [
          { name: "no-parents" },
          {
            name: "parking with model",
            model: "DeviceRestricted",
          },
          { name: "test child", path: groupTestId },
          // ERRORS
          { name: "id taken", _id: groupTestId },
          { name: "wrong path", path: "wrong.path" },
          //Name already taken
          { name: "Test group" },
        ],
      },
    };

    const { result } = await sdk.query<
      ApiGroupMCreateRequest,
      ApiGroupMCreateResult
    >(queryWithError);
    expect(result).toHaveProperty("successes");
    expect(result).toHaveProperty("errors");
    expect(result.errors).toHaveLength(3);
    expect(result.successes).toHaveLength(3);
    expect(result.errors[0].document.body).toMatchObject({
      name: "id taken",
    });
    expect(result.errors[0].reason).toBe("document already exists");
    expect(result.errors[1].document.body).toMatchObject({
      name: "wrong path",
    });
    expect(result.errors[1].reason).toBe(
      'The closest parent group "path" does not exist',
    );

    expect(result.errors[2].document.body).toMatchObject({
      name: "Test group",
    });
    expect(result.errors[2].reason).toBe(
      'A group with name "Test group" already exist',
    );
  });

  it("can update multiple groups at once", async () => {
    const missingIdBody = { name: "missing id" };
    const badParentId = {
      _id: groupTestId,
      name: "bad parent",
      path: "not-exist." + groupTestId,
    };
    const duplicateGroupNameBody = {
      _id: groupTestParentId1,
      name: "test group",
      path: groupTestParentId1,
    };
    const updateNameBody = {
      _id: groupTestId,
      name: "root group",
      path: groupTestId,
    };
    const mUpdateQuery = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "mUpdate",
      body: {
        groups: [
          missingIdBody,
          badParentId,
          duplicateGroupNameBody,
          updateNameBody,
        ],
      },
    } as ApiGroupMUpdateRequest;

    const { result } = await sdk.query<
      ApiGroupMUpdateRequest,
      ApiGroupMUpdateResult
    >(mUpdateQuery);

    expect(result).toHaveProperty("successes");
    expect(result).toHaveProperty("errors");
    expect(result.errors).toHaveLength(3);
    expect(result.successes).toHaveLength(1);
    expect(result.errors[0].document.body.name).toBe("missing id");
    expect(result.errors[0].reason).toBe("A group must have an _id");
    expect(result.errors[1].document.body).toMatchObject({
      name: "test group",
    });
    expect(result.errors[1].reason).toBe(
      'A group with name "test group" already exist',
    );
    expect(result.errors[2].document.body).toMatchObject({
      name: "bad parent",
    });
    expect(result.errors[2].reason).toBe(
      'The closest parent group "not-exist" does not exist',
    );
  });

  it("can upsert multiple groups at once", async () => {
    const createNoParent = { name: "no-parents" };
    const createWithModel = {
      name: "parking with model",
      model: "DeviceRestricted",
    };
    const createWithParent = { name: "test child", path: groupTestId };
    const updateNameBody = {
      _id: groupTestId,
      name: "root group",
      path: groupTestId,
    };
    // ERRORS
    const createBadPath = { name: "wrong path", path: "wrong.path" };
    //Name already taken
    const createNameTaken = { name: "Test group" };
    const updateBadParent = {
      _id: groupTestId,
      name: "bad parent",
      path: "not-exist." + groupTestId,
    };
    const updateNameTaken = {
      _id: groupTestParentId1,
      name: "Test group",
      path: groupTestParentId1,
    };

    const mUpsertQuery = {
      controller: "device-manager/groups",
      engineId: "engine-ayse",
      action: "mUpsert",
      body: {
        groups: [
          createNoParent,
          createWithModel,
          createWithParent,
          createBadPath,
          createNameTaken,
          updateBadParent,
          updateNameTaken,
          updateNameBody,
        ],
      },
    } as ApiGroupMUpsertRequest;

    const { result } = await sdk.query<
      ApiGroupMUpsertRequest,
      ApiGroupMUpsertResult
    >(mUpsertQuery);

    expect(result).toHaveProperty("successes");
    expect(result).toHaveProperty("errors");
    expect(result.successes).toHaveLength(4);
    const errors = result.errors.sort((a, b) =>
      toLower(a.document?.body?.name).localeCompare(
        toLower(b.document?.body?.name),
      ),
    );
    expect(errors).toHaveLength(4);

    expect(errors[0].document.body.name).toBe("bad parent");
    expect(errors[0].reason).toBe(
      'The closest parent group "not-exist" does not exist',
    );
    expect(result.errors[1].document.body).toMatchObject({
      name: "Test group",
    });
    expect(result.errors[1].reason).toBe(
      'A group with name "Test group" already exist',
    );
    expect(result.errors[2].document.body).toMatchObject({
      name: "Test group",
    });
    expect(result.errors[2].reason).toBe(
      'A group with name "Test group" already exist',
    );
    expect(result.errors[3].document.body).toMatchObject({
      name: "wrong path",
    });
    expect(errors[3].reason).toBe(
      'The closest parent group "path" does not exist',
    );
  });
});
