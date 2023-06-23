import {
  assetGroupTestId,
  assetGroupTestBody,
  assetGroupTestParentId1,
  assetGroupTestParentBody1,
  assetGroupTestChildrenId1,
  assetGroupTestChildrenBody1,
  assetGroupTestChildrenId2,
  assetGroupTestParentId2,
  assetGroupChildrenWithAssetId,
  assetGroupParentWithAssetId,
} from "../../../fixtures/assetsGroups";

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
  ApiGroupRemoveAssetsRequest,
} from "../../../../lib/modules/asset/types/AssetGroupsApi";
import { AssetsGroupContent } from "../../../../lib/modules/asset/exports";
import { InternalCollection } from "../../../../lib/modules/plugin";
import { setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("AssetsGroupsController", () => {
  const sdk = setupHooks();

  it("can create a group", async () => {
    const missingBodyQuery: Omit<ApiGroupCreateRequest, "body"> = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "create",
      _id: "root-group",
    };
    await expect(sdk.query(missingBodyQuery)).rejects.toThrow(
      /^The request must specify a body.$/
    );

    const badParentIdQuery: ApiGroupCreateRequest = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "create",
      _id: "parent-not-exist",
      body: {
        name: "Parent not exist",
        parent: "not-exist",
      },
    };
    await expect(sdk.query(badParentIdQuery)).rejects.toThrow(
      /^The parent group "not-exist" does not exist$/
    );

    const duplicateGroupName: ApiGroupCreateRequest = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "create",
      body: {
        name: "test group",
      },
    };
    await expect(sdk.query(duplicateGroupName)).rejects.toThrow(
      /^A group with name "test group" already exist$/
    );

    const { result: assetGroupRoot } = await sdk.query<
      ApiGroupCreateRequest,
      ApiGroupCreateResult
    >({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "create",
      _id: "root-group",
      body: {
        name: "root group",
      },
    });

    expect(assetGroupRoot._id).toBe("root-group");
    expect(assetGroupRoot._source).toMatchObject({
      name: "root group",
      children: [],
      parent: null,
    });

    const { result: assetGroupChildren } = await sdk.query<
      ApiGroupCreateRequest,
      ApiGroupCreateResult
    >({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "create",
      _id: "children-group",
      body: {
        name: "children group",
        parent: "root-group",
      },
    });

    expect(assetGroupChildren._id).toBe("children-group");
    expect(assetGroupChildren._source).toMatchObject({
      name: "children group",
      children: [],
      parent: "root-group",
    });

    const { result: assetGroupWithoutIdSpecified } = await sdk.query<
      ApiGroupCreateRequest,
      ApiGroupCreateResult
    >({
      controller: "device-manager/assetsGroup",
      action: "create",
      engineId: "engine-ayse",
      body: {
        name: "group",
      },
    });

    expect(typeof assetGroupWithoutIdSpecified._id).toBe("string");
  });

  it("can get a group", async () => {
    const missingIdQuery: Omit<ApiGroupGetRequest, "_id"> = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "get",
    };
    await expect(sdk.query(missingIdQuery)).rejects.toThrow(
      /^Missing argument "_id".$/
    );

    const { result } = await sdk.query<ApiGroupGetRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "get",
      _id: assetGroupTestId,
    });

    expect(result._id).toEqual(assetGroupTestId);
    expect(result._source).toMatchObject(assetGroupTestBody);
  });

  it("can update a group", async () => {
    const missingIdQuery: Omit<ApiGroupUpdateRequest, "_id"> = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "update",
      body: assetGroupTestBody,
    };
    await expect(sdk.query(missingIdQuery)).rejects.toThrow(
      /^Missing argument "_id".$/
    );

    const missingBodyQuery: Omit<ApiGroupUpdateRequest, "body"> = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "update",
      _id: assetGroupTestId,
    };
    await expect(sdk.query(missingBodyQuery)).rejects.toThrow(
      /^The request must specify a body.$/
    );

    const badParentIdQuery: ApiGroupUpdateRequest = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "update",
      _id: assetGroupTestId,
      body: {
        name: "root group",
        children: ["children-group"],
        parent: "not-exist",
      },
    };
    await expect(sdk.query(badParentIdQuery)).rejects.toThrow(
      /^The parent group "not-exist" does not exist$/
    );

    const badChildrenIdQuery: ApiGroupUpdateRequest = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "update",
      _id: assetGroupTestId,
      body: {
        name: "root group",
        children: [assetGroupTestChildrenId1, "not-exist"],
      },
    };
    await expect(sdk.query(badChildrenIdQuery)).rejects.toThrow(
      /^The children group "not-exist" does not exist$/
    );

    const duplicateGroupName: ApiGroupUpdateRequest = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "update",
      _id: assetGroupTestParentId1,
      body: {
        name: "test group",
        children: [],
      },
    };
    await expect(sdk.query(duplicateGroupName)).rejects.toThrow(
      /^A group with name "test group" already exist$/
    );

    const { result } = await sdk.query<ApiGroupUpdateRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "update",
      _id: assetGroupTestId,
      body: {
        name: "root group",
        children: [],
      },
    });

    expect(result._id).toEqual(assetGroupTestId);
    expect(result._source).toMatchObject({
      name: "root group",
      children: [],
      parent: null,
    });

    const { result: resultChildren } = await sdk.query<ApiGroupUpdateRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "update",
      _id: assetGroupTestId,
      body: {
        name: "root group",
        children: [assetGroupTestChildrenId1],
      },
    });

    expect(resultChildren._id).toEqual(assetGroupTestId);
    expect(resultChildren._source).toMatchObject({
      name: "root group",
      children: [assetGroupTestChildrenId1],
      parent: null,
    });
  });

  it("can delete a group", async () => {
    const missingIdQuery: Omit<ApiGroupDeleteRequest, "_id"> = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "delete",
    };
    await expect(sdk.query(missingIdQuery)).rejects.toThrow(
      /^Missing argument "_id".$/
    );

    const { error, status } = await sdk.query<ApiGroupDeleteRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "delete",
      _id: assetGroupTestId,
    });

    expect(error).toBeNull();
    expect(status).toBe(200);

    await sdk.query<ApiGroupDeleteRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "delete",
      _id: assetGroupTestParentId1,
    });

    const { _source: childrenGroup } =
      await sdk.document.get<AssetsGroupContent>(
        "engine-ayse",
        InternalCollection.ASSETS_GROUPS,
        assetGroupTestChildrenId1
      );

    expect(childrenGroup).toMatchObject({
      parent: null,
    });

    await sdk.query<ApiGroupDeleteRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "delete",
      _id: assetGroupTestChildrenId2,
    });

    const { _source: parentGroup } = await sdk.document.get<AssetsGroupContent>(
      "engine-ayse",

      InternalCollection.ASSETS_GROUPS,
      assetGroupTestParentId2
    );

    expect(parentGroup).toMatchObject({
      children: [],
    });

    await sdk.query<ApiGroupDeleteRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "delete",
      _id: assetGroupParentWithAssetId,
    });

    const { _source: assetGrouped } =
      await sdk.document.get<AssetsGroupContent>(
        "engine-ayse",
        InternalCollection.ASSETS,
        "Container-grouped"
      );

    expect(assetGrouped).toMatchObject({
      groups: [assetGroupChildrenWithAssetId],
    });
  });

  it("can search groups", async () => {
    const { result } = await sdk.query<ApiGroupSearchRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "search",
      body: {
        query: {
          terms: {
            _id: [
              assetGroupTestId,
              assetGroupTestParentId1,
              assetGroupTestChildrenId1,
            ],
          },
        },
      },
    });

    const hits: ApiGroupSearchResult["hits"] = [
      {
        _id: assetGroupTestId,
        _score: 1,
        _source: assetGroupTestBody,
      },
      {
        _id: assetGroupTestParentId1,
        _score: 1,
        _source: assetGroupTestParentBody1,
      },
      {
        _id: assetGroupTestChildrenId1,
        _score: 1,
        _source: assetGroupTestChildrenBody1,
      },
    ];

    expect(result).toMatchObject({
      fetched: hits.length,
      hits,
      total: hits.length,
    });
  });

  it("can add asset to a group", async () => {
    const missingIdQuery: Omit<ApiGroupAddAssetsRequest, "_id"> = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "addAsset",
      body: {
        assetIds: [],
      },
    };
    await expect(sdk.query(missingIdQuery)).rejects.toThrow(
      /^Missing argument "_id".$/
    );

    const missingBodyQuery: Omit<ApiGroupAddAssetsRequest, "body"> = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "addAsset",
      _id: assetGroupTestId,
    };
    await expect(sdk.query(missingBodyQuery)).rejects.toThrow(
      /^The request must specify a body.$/
    );

    const badIdQuery: ApiGroupAddAssetsRequest = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "addAsset",
      _id: "bad-id",
      body: {
        assetIds: [],
      },
    };
    await expect(sdk.query(badIdQuery)).rejects.toThrow(
      /^Document "bad-id" not found in "engine-ayse":"assets-groups".$/
    );

    const { result } = await sdk.query<ApiGroupAddAssetsRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "addAsset",
      _id: assetGroupTestId,
      body: {
        assetIds: ["Container-linked1", "Container-linked2"],
      },
    });

    expect(result.errors).toHaveLength(0);

    expect(result.successes).toMatchObject([
      { _id: "Container-linked1", _source: { groups: [assetGroupTestId] } },
      { _id: "Container-linked2", _source: { groups: [assetGroupTestId] } },
    ]);

    // Add assets in an second group
    const { result: result2 } = await sdk.query<ApiGroupAddAssetsRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "addAsset",
      _id: assetGroupTestParentId1,
      body: {
        assetIds: ["Container-linked1", "Container-linked2"],
      },
    });

    expect(result2.errors).toHaveLength(0);

    expect(result2.successes).toMatchObject([
      {
        _id: "Container-linked1",
        _source: {
          groups: [assetGroupTestId, assetGroupTestParentId1],
        },
      },
      {
        _id: "Container-linked2",
        _source: {
          groups: [assetGroupTestId, assetGroupTestParentId1],
        },
      },
    ]);
  });

  it("can remove asset to group", async () => {
    const missingIdQuery: Omit<ApiGroupRemoveAssetsRequest, "_id"> = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "removeAsset",
      body: {
        assetIds: [],
      },
    };
    await expect(sdk.query(missingIdQuery)).rejects.toThrow(
      /^Missing argument "_id".$/
    );

    const missingBodyQuery: Omit<ApiGroupRemoveAssetsRequest, "body"> = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "removeAsset",
      _id: assetGroupTestId,
    };
    await expect(sdk.query(missingBodyQuery)).rejects.toThrow(
      /^The request must specify a body.$/
    );

    const badIdQuery: ApiGroupRemoveAssetsRequest = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "removeAsset",
      _id: "bad-id",
      body: {
        assetIds: [],
      },
    };
    await expect(sdk.query(badIdQuery)).rejects.toThrow(
      /^Document "bad-id" not found in "engine-ayse":"assets-groups".$/
    );

    const { result } = await sdk.query<ApiGroupRemoveAssetsRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "removeAsset",
      _id: assetGroupChildrenWithAssetId,
      body: {
        assetIds: ["Container-grouped"],
      },
    });

    expect(result.errors).toHaveLength(0);

    expect(result.successes[0]).toMatchObject({
      _id: "Container-grouped",
      _source: {
        groups: [assetGroupParentWithAssetId],
      },
    });
  });
});
