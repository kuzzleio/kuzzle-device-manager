import { vi } from "vitest";
import { setupHooks } from "../../../helpers";

vi.setConfig({ testTimeout: 30000 });

describe("ModelsController:assets:tenant-scoped", () => {
  const sdk = setupHooks();

  it("Write a tenant-scoped asset model with indexes", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        model: "TenantSensor",
        metadataMappings: { location: { type: "keyword" } },
        measures: [{ name: "temperatureExt", type: "temperature" }],
        indexes: ["engine-ayse"],
      },
    });

    const doc = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-engine-ayse-TenantSensor",
    );

    expect(doc._source).toMatchObject({
      type: "asset",
      indexes: ["engine-ayse"],
      asset: {
        model: "TenantSensor",
        metadataMappings: { location: { type: "keyword" } },
        measures: [{ name: "temperatureExt", type: "temperature" }],
      },
    });
    expect(doc._source).not.toHaveProperty("engineGroups");
  });

  it("Write without indexes still works (backward compat)", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality"],
        model: "GroupSensor",
        metadataMappings: { location: { type: "keyword" } },
        measures: [{ name: "temperatureExt", type: "temperature" }],
      },
    });

    const doc = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-GroupSensor",
    );

    expect(doc._source).toMatchObject({
      type: "asset",
      engineGroups: ["air_quality"],
      asset: { model: "GroupSensor" },
    });
    expect(doc._source).not.toHaveProperty("indexes");
  });

  it("Same model name at tenant and group scope is rejected (anti-shadowing)", async () => {
    // Group-scoped model
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality"],
        model: "DualScope",
        metadataMappings: { version: { type: "keyword" } },
        measures: [],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    // Tenant-scoped model with same name should be rejected
    await expect(
      sdk.query({
        controller: "device-manager/models",
        action: "writeAsset",
        body: {
          model: "DualScope",
          metadataMappings: { version: { type: "keyword" } },
          measures: [],
          indexes: ["engine-ayse"],
        },
      }),
    ).rejects.toThrow(/already exists at group scope/);
  });

  it("List returns tenant + group + commons models", async () => {
    // Create a tenant-scoped model
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        model: "TenantOnly",
        metadataMappings: {},
        measures: [],
        indexes: ["engine-ayse"],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const listResult = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroups: ["air_quality"],
      index: "engine-ayse",
    });

    const ids = listResult.result.models.map((m: { _id: string }) => m._id);

    // Should include: commons models (Container, MagicHouse, Warehouse),
    // air_quality group model (Room), and tenant-scoped model (TenantOnly)
    expect(ids).toContain("model-asset-Container");
    expect(ids).toContain("model-asset-Warehouse");
    expect(ids).toContain("model-asset-Room");
    expect(ids).toContain("model-asset-engine-ayse-TenantOnly");
  });

  it("List without index returns only group + commons models (no tenant-scoped)", async () => {
    const listResult = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroups: ["air_quality"],
    });

    const ids = listResult.result.models.map((m: { _id: string }) => m._id);
    // Should include group-scoped and commons models
    expect(ids).toContain("model-asset-Room");
    expect(ids).toContain("model-asset-Container");
    // Should NOT include tenant-scoped models
    expect(ids).not.toContain("model-asset-engine-ayse-TenantOnly");
  });

  it("getAsset with index returns the tenant-scoped model", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        model: "TenantGetTest",
        metadataMappings: { scope: { type: "keyword" } },
        defaultValues: { scope: "tenant" },
        measures: [],
        indexes: ["engine-ayse"],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const result = await sdk.query({
      controller: "device-manager/models",
      action: "getAsset",
      engineGroups: ["air_quality"],
      model: "TenantGetTest",
      index: "engine-ayse",
    });

    expect(result.result._source.indexes).toEqual(["engine-ayse"]);
    expect(result.result._source.asset.defaultMetadata).toMatchObject({
      scope: "tenant",
    });
  });

  it("getAsset falls back to group when no tenant-scoped model exists", async () => {
    // Only group-scoped model, no tenant-scoped one
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality"],
        model: "FallbackTest",
        metadataMappings: { scope: { type: "keyword" } },
        defaultValues: { scope: "group" },
        measures: [],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const result = await sdk.query({
      controller: "device-manager/models",
      action: "getAsset",
      engineGroups: ["air_quality"],
      model: "FallbackTest",
      index: "engine-ayse",
    });

    expect(result.result._source).not.toHaveProperty("indexes");
    expect(result.result._source.asset.defaultMetadata).toMatchObject({
      scope: "group",
    });
  });

  it("Model scoped to multiple tenants is accessible from each", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        model: "SharedTenant",
        metadataMappings: {},
        measures: [],
        indexes: ["engine-ayse", "engine-kuzzle"],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    // Accessible from engine-ayse
    const listAyse = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroups: ["air_quality"],
      index: "engine-ayse",
    });
    const idsAyse = listAyse.result.models.map((m: { _id: string }) => m._id);
    expect(idsAyse).toContain(
      "model-asset-engine-ayse+engine-kuzzle-SharedTenant",
    );

    // Accessible from engine-kuzzle
    const listKuzzle = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroups: ["air_quality"],
      index: "engine-kuzzle",
    });
    const idsKuzzle = listKuzzle.result.models.map(
      (m: { _id: string }) => m._id,
    );
    expect(idsKuzzle).toContain(
      "model-asset-engine-ayse+engine-kuzzle-SharedTenant",
    );
  });
});
