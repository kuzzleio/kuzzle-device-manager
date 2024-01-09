import { KDocument } from "kuzzle-sdk";
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
  ApiGroupAddAssetsResult,
  ApiGroupRemoveAssetsRequest,
  ApiGroupRemoveAssetsResult,
} from "../../../../lib/modules/asset/types/AssetGroupsApi";
import {
  AssetContent,
  AssetsGroupContent,
} from "../../../../lib/modules/asset/exports";
import { InternalCollection } from "../../../../lib/modules/plugin";
import { setupHooks } from "../../../helpers";
import { loadSecurityDefault } from "../../../hooks/security";

jest.setTimeout(10000);

describe("AssetsGroupsController", () => {
  const sdk = setupHooks();
  const now = Date.now();

  beforeAll(async () => {
    await loadSecurityDefault(sdk);
    // ? Use user with restricted permissions to tests permissions
    await sdk.auth.login("local", {
      username: "ayse-admin",
      password: "password",
    });
  });

  it("can create a group", async () => {
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
    expect(assetGroupRoot._source.lastUpdate).toBeGreaterThanOrEqual(now);

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

    const { _source: rootGroup } = await sdk.document.get<AssetsGroupContent>(
      "engine-ayse",
      InternalCollection.ASSETS_GROUPS,
      "root-group"
    );

    expect(rootGroup).toMatchObject({
      children: ["children-group"],
    });
    expect(rootGroup.lastUpdate).toBeGreaterThanOrEqual(now);

    expect(assetGroupChildren._id).toBe("children-group");
    expect(assetGroupChildren._source).toMatchObject({
      name: "children group",
      children: [],
      parent: "root-group",
    });
    expect(assetGroupChildren._source.lastUpdate).toBeGreaterThanOrEqual(now);

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
    expect(result._source.lastUpdate).toBeGreaterThanOrEqual(now);

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
    expect(resultChildren._source.lastUpdate).toBeGreaterThanOrEqual(now);
  });

  it("can delete a group", async () => {
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
    expect(childrenGroup.lastUpdate).toBeGreaterThanOrEqual(now);

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
    expect(parentGroup.lastUpdate).toBeGreaterThanOrEqual(now);

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
      groups: [
        {
          id: assetGroupChildrenWithAssetId,
        },
      ],
    });
  });

  it("can search groups", async () => {
    const { result } = await sdk.query<ApiGroupSearchRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "search",
      body: {
        query: {
          ids: {
            values: [
              assetGroupTestId,
              assetGroupTestParentId1,
              assetGroupTestChildrenId1,
            ],
          },
        },
      },
      lang: "koncorde",
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
    const { result } = await sdk.query<
      ApiGroupAddAssetsRequest,
      ApiGroupAddAssetsResult
    >({
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
      {
        _id: "Container-linked1",
        _source: {
          groups: [
            {
              id: assetGroupTestId,
            },
          ],
        },
      },
      {
        _id: "Container-linked2",
        _source: {
          groups: [
            {
              id: assetGroupTestId,
            },
          ],
        },
      },
    ]);

    // ? Dates should be separately because is not really predictable
    const assets = result.successes as KDocument<AssetContent>[];
    expect(assets[0]._source.groups[0].date).toBeGreaterThan(now);
    expect(assets[1]._source.groups[0].date).toBeGreaterThan(now);

    expect(result.assetsGroups._source.lastUpdate).toBeGreaterThan(now);

    // Add assets in an second group
    const { result: result2 } = await sdk.query<
      ApiGroupAddAssetsRequest,
      ApiGroupAddAssetsResult
    >({
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
          groups: [
            {
              id: assetGroupTestId,
            },
            {
              id: assetGroupTestParentId1,
            },
          ],
        },
      },
      {
        _id: "Container-linked2",
        _source: {
          groups: [
            {
              id: assetGroupTestId,
            },
            {
              id: assetGroupTestParentId1,
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

    expect(result2.assetsGroups._source.lastUpdate).toBeGreaterThan(now);

    // Add an asset to a subgroup also add the reference of the parent group
    const { result: result3 } = await sdk.query<
      ApiGroupAddAssetsRequest,
      ApiGroupAddAssetsResult
    >({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "addAsset",
      _id: assetGroupTestChildrenId1,
      body: {
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
              id: assetGroupTestParentId1,
            },
            {
              id: assetGroupTestChildrenId1,
            },
          ],
        },
      },
    ]);

    // ? Dates should be separately because is not really predictable
    const assets3 = result3.successes as KDocument<AssetContent>[];
    expect(assets3[0]._source.groups[0].date).toBeGreaterThan(now);
    expect(assets3[0]._source.groups[1].date).toBeGreaterThan(now);

    expect(result3.assetsGroups._source.lastUpdate).toBeGreaterThan(now);
  });

  it("can remove asset to group", async () => {
    const { result } = await sdk.query<
      ApiGroupRemoveAssetsRequest,
      ApiGroupRemoveAssetsResult
    >({
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
        groups: [
          {
            id: assetGroupParentWithAssetId,
          },
        ],
      },
    });

    expect(result.assetsGroups._source.lastUpdate).toBeGreaterThan(now);

    const { result: result2 } = await sdk.query<
      ApiGroupRemoveAssetsRequest,
      ApiGroupRemoveAssetsResult
    >({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "removeAsset",
      _id: assetGroupParentWithAssetId,
      body: {
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

    expect(result2.assetsGroups._source.lastUpdate).toBeGreaterThan(now);
  });
});
