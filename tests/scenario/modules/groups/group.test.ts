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
} from "../../../../lib/modules/group/types/GroupsApi";
import { AssetContent } from "../../../../lib/modules/asset/exports";
import { InternalCollection } from "../../../../lib/modules/plugin";
import { setupHooks } from "../../../helpers";
import { GroupContent } from "lib/modules/group/types/GroupContent";

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
      'The group with path "bad-id" does not exist',
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
  });

  it("can remove asset to group", async () => {
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
});
