import _ from "lodash";
import {
  assetGroupTestId,
  assetGroupTestBody,
  assetGroupTestParentId,
  assetGroupTestParentBody,
  assetGroupTestChildrenId,
  assetGroupTestChildrenBody,
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
} from "../../../../lib/modules/asset/types/AssetGroupsAPI";
import { setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("AssetsGroupsController", () => {
  const sdk = setupHooks();

  it("can create a group", async () => {
    const missingIdQuery: Omit<ApiGroupCreateRequest, "_id"> = {
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "create",
      body: {
        name: "root group",
      },
    };
    await expect(sdk.query(missingIdQuery)).rejects.toThrow(
      /^Missing argument "_id".$/
    );

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
    expect(_.omit(assetGroupRoot._source, "_kuzzle_info")).toStrictEqual({
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
    expect(_.omit(assetGroupChildren._source, "_kuzzle_info")).toStrictEqual({
      name: "children group",
      children: [],
      parent: "root-group",
    });
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
    expect(_.omit(result._source, "_kuzzle_info")).toStrictEqual(
      assetGroupTestBody
    );
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
        children: [assetGroupTestChildrenId, "not-exist"],
      },
    };
    await expect(sdk.query(badChildrenIdQuery)).rejects.toThrow(
      /^The children group "not-exist" does not exist$/
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
    expect(_.omit(result._source, "_kuzzle_info")).toStrictEqual({
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
        children: [assetGroupTestChildrenId],
      },
    });

    expect(resultChildren._id).toEqual(assetGroupTestId);
    expect(_.omit(resultChildren._source, "_kuzzle_info")).toStrictEqual({
      name: "root group",
      children: [assetGroupTestChildrenId],
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

    expect({ error, status }).toStrictEqual({
      error: null,
      status: 200,
    });
  });

  it("can search groups", async () => {
    const { result } = await sdk.query<ApiGroupSearchRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "search",
      body: {},
    });

    const resultHits = result.hits.map(({ _id, _score, _source }) => ({
      _id,
      _score,
      _source: _.omit(_source, "_kuzzle_info"),
    }));

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

    expect({
      fetched: result.fetched,
      total: result.total,
      hits: resultHits,
    }).toStrictEqual({
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

    const { error, status } = await sdk.query<ApiGroupAddAssetsRequest>({
      controller: "device-manager/assetsGroup",
      engineId: "engine-ayse",
      action: "addAsset",
      _id: assetGroupTestId,
      body: {
        assetIds: ["Container-linked1", "Container-linked2"],
      },
    });

    expect({ error, status }).toStrictEqual({
      error: null,
      status: 200,
    });
  });
});
