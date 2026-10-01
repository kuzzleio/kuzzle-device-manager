import { vi } from "vitest";
import {
  ApiAssetCreateRequest,
  ApiAssetGetRequest,
  ApiAssetGetResult,
} from "../../../../lib/modules/asset";
import {
  ApiModelDeleteAssetRequest,
  ApiModelWriteAssetRequest,
} from "../../../../lib/modules/model";
import { setupHooks } from "../../../helpers";

vi.setConfig({ testTimeout: 30000 });

describe("Asset model refresh scope", () => {
  const sdk = setupHooks();

  const modelIds = [
    "model-asset-engine-ayse-ScopedRefresh",
    "model-asset-engine-kuzzle-ScopedRefresh",
    "model-asset-air_quality+other-group-MultiGroupRefresh",
    "model-asset-ManyRefresh",
  ];

  afterAll(async () => {
    for (const _id of modelIds) {
      if (await sdk.document.exists("device-manager", "models", _id)) {
        await sdk.query<ApiModelDeleteAssetRequest>({
          controller: "device-manager/models",
          action: "deleteAsset",
          _id,
        });
      }
    }
  });

  async function getAsset(engineId: string, _id: string) {
    const { result } = await sdk.query<ApiAssetGetRequest, ApiAssetGetResult>({
      controller: "device-manager/assets",
      action: "get",
      engineId,
      _id,
    });

    return result;
  }

  it("should only refresh the assets of the tenants of a tenant-scoped model", async () => {
    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        model: "ScopedRefresh",
        engineIds: ["engine-ayse"],
        metadataMappings: { refreshColor: { type: "keyword" } },
        measures: [],
      },
    });
    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        model: "ScopedRefresh",
        engineIds: ["engine-kuzzle"],
        metadataMappings: { refreshSize: { type: "keyword" } },
        measures: [],
      },
    });
    await sdk.collection.refresh("device-manager", "models");

    await sdk.query<ApiAssetCreateRequest>({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-ayse",
      body: {
        model: "ScopedRefresh",
        reference: "ayse",
        metadata: { refreshColor: "red" },
      },
    });
    await sdk.query<ApiAssetCreateRequest>({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-kuzzle",
      body: {
        model: "ScopedRefresh",
        reference: "kuzzle",
        metadata: { refreshSize: "big" },
      },
    });

    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        model: "ScopedRefresh",
        engineIds: ["engine-ayse"],
        metadataMappings: {
          refreshColor: { type: "keyword" },
          refreshWeight: { type: "keyword" },
        },
        defaultValues: { refreshWeight: "light" },
        measures: [],
      },
    });

    const ayseAsset = await getAsset("engine-ayse", "ScopedRefresh-ayse");
    expect(ayseAsset._source.metadata).toEqual({
      refreshColor: "red",
      refreshWeight: "light",
    });

    const kuzzleAsset = await getAsset("engine-kuzzle", "ScopedRefresh-kuzzle");
    expect(kuzzleAsset._source.metadata).toEqual({ refreshSize: "big" });
  });

  it("should refresh the assets of every engine group of the model", async () => {
    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality", "other-group"],
        model: "MultiGroupRefresh",
        metadataMappings: { refreshColor: { type: "keyword" } },
        measures: [],
      },
    });
    await sdk.collection.refresh("device-manager", "models");

    await sdk.query<ApiAssetCreateRequest>({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-other-group",
      body: {
        model: "MultiGroupRefresh",
        reference: "other",
        metadata: { refreshColor: "blue" },
      },
    });

    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality", "other-group"],
        model: "MultiGroupRefresh",
        metadataMappings: {
          refreshColor: { type: "keyword" },
          refreshWeight: { type: "keyword" },
        },
        defaultValues: { refreshWeight: "light" },
        measures: [],
      },
    });

    const asset = await getAsset(
      "engine-other-group",
      "MultiGroupRefresh-other",
    );
    expect(asset._source.metadata).toEqual({
      refreshColor: "blue",
      refreshWeight: "light",
    });
  });

  it("should refresh more assets than the default search size", async () => {
    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["commons"],
        model: "ManyRefresh",
        metadataMappings: { refreshColor: { type: "keyword" } },
        measures: [],
      },
    });
    await sdk.collection.refresh("device-manager", "models");

    const references = Array.from({ length: 15 }, (_, i) => `many${i}`);

    for (const reference of references) {
      await sdk.query<ApiAssetCreateRequest>({
        controller: "device-manager/assets",
        action: "create",
        engineId: "engine-ayse",
        body: {
          model: "ManyRefresh",
          reference,
          metadata: { refreshColor: "red" },
        },
      });
    }

    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["commons"],
        model: "ManyRefresh",
        metadataMappings: {
          refreshColor: { type: "keyword" },
          refreshWeight: { type: "keyword" },
        },
        defaultValues: { refreshWeight: "light" },
        measures: [],
      },
    });

    const { successes } = await sdk.document.mGet(
      "engine-ayse",
      "assets",
      references.map((reference) => `ManyRefresh-${reference}`),
    );

    expect(successes).toHaveLength(15);
    for (const asset of successes) {
      expect(asset._source.metadata).toEqual({
        refreshColor: "red",
        refreshWeight: "light",
      });
    }
  });
});
