import { vi } from "vitest";
import { setupHooks } from "../../../helpers";

vi.setConfig({ testTimeout: 30000 });

describe("ModelsController:assets:tenant-scoped", () => {
  const sdk = setupHooks();

  it("Write a tenant-scoped asset model with engines", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "air_quality",
        model: "TenantSensor",
        metadataMappings: { location: { type: "keyword" } },
        measures: [{ name: "temperatureExt", type: "temperature" }],
        engines: ["engine-ayse"],
      },
    });

    const doc = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-air_quality-engine-ayse-TenantSensor",
    );

    expect(doc._source).toMatchObject({
      type: "asset",
      engineGroup: "air_quality",
      engines: ["engine-ayse"],
      asset: {
        model: "TenantSensor",
        metadataMappings: { location: { type: "keyword" } },
        measures: [{ name: "temperatureExt", type: "temperature" }],
      },
    });
  });

  it("Write without engines still works (backward compat)", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "air_quality",
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
      engineGroup: "air_quality",
      asset: { model: "GroupSensor" },
    });
    expect(doc._source).not.toHaveProperty("engines");
  });

  it("Same model name at tenant and group scope coexist with distinct IDs", async () => {
    // Group-scoped model
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "air_quality",
        model: "DualScope",
        metadataMappings: { version: { type: "keyword" } },
        measures: [],
      },
    });

    // Tenant-scoped model with same name
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "air_quality",
        model: "DualScope",
        metadataMappings: { version: { type: "keyword" } },
        measures: [],
        engines: ["engine-ayse"],
      },
    });

    const groupDoc = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-DualScope",
    );
    const tenantDoc = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-air_quality-engine-ayse-DualScope",
    );

    expect(groupDoc._id).toBe("model-asset-DualScope");
    expect(tenantDoc._id).toBe("model-asset-air_quality-engine-ayse-DualScope");
    expect(groupDoc._source).not.toHaveProperty("engines");
    expect(tenantDoc._source.engines).toEqual(["engine-ayse"]);
  });

  it("List returns tenant + group + commons models", async () => {
    // Create a tenant-scoped model
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "air_quality",
        model: "TenantOnly",
        metadataMappings: {},
        measures: [],
        engines: ["engine-ayse"],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const listResult = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroup: "air_quality",
      engineId: "engine-ayse",
    });

    const ids = listResult.result.models.map((m: { _id: string }) => m._id);

    // Should include: commons models (Container, MagicHouse, Warehouse),
    // air_quality group model (Room), and tenant-scoped model (TenantOnly)
    expect(ids).toContain("model-asset-Container");
    expect(ids).toContain("model-asset-Warehouse");
    expect(ids).toContain("model-asset-Room");
    expect(ids).toContain("model-asset-air_quality-engine-ayse-TenantOnly");
  });

  it("List without engineId returns only group + commons (backward compat)", async () => {
    // Create a tenant-scoped model that should NOT appear
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "air_quality",
        model: "HiddenTenant",
        metadataMappings: {},
        measures: [],
        engines: ["engine-ayse"],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const listResult = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroup: "air_quality",
    });

    const ids = listResult.result.models.map((m: { _id: string }) => m._id);

    // Should NOT include tenant-scoped models
    expect(ids).not.toContain(
      "model-asset-air_quality-engine-ayse-HiddenTenant",
    );
    // Should include group + commons
    expect(ids).toContain("model-asset-Container");
    expect(ids).toContain("model-asset-Room");
  });

  it("getAsset returns tenant-scoped model over group-scoped when both exist", async () => {
    // Group-scoped model
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "air_quality",
        model: "Priority",
        metadataMappings: { scope: { type: "keyword" } },
        defaultValues: { scope: "group" },
        measures: [],
      },
    });

    // Tenant-scoped model with same name
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "air_quality",
        model: "Priority",
        metadataMappings: { scope: { type: "keyword" } },
        defaultValues: { scope: "tenant" },
        measures: [],
        engines: ["engine-ayse"],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const result = await sdk.query({
      controller: "device-manager/models",
      action: "getAsset",
      engineGroup: "air_quality",
      model: "Priority",
      engineId: "engine-ayse",
    });

    expect(result.result._source.engines).toEqual(["engine-ayse"]);
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
        engineGroup: "air_quality",
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
      engineGroup: "air_quality",
      model: "FallbackTest",
      engineId: "engine-ayse",
    });

    expect(result.result._source).not.toHaveProperty("engines");
    expect(result.result._source.asset.defaultMetadata).toMatchObject({
      scope: "group",
    });
  });

  it("Model scoped to multiple tenants is accessible from each", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "air_quality",
        model: "SharedTenant",
        metadataMappings: {},
        measures: [],
        engines: ["engine-ayse", "engine-kuzzle"],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    // Accessible from engine-ayse
    const listAyse = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroup: "air_quality",
      engineId: "engine-ayse",
    });
    const idsAyse = listAyse.result.models.map((m: { _id: string }) => m._id);
    expect(idsAyse).toContain(
      "model-asset-air_quality-engine-ayse+engine-kuzzle-SharedTenant",
    );

    // Accessible from engine-kuzzle
    const listKuzzle = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroup: "air_quality",
      engineId: "engine-kuzzle",
    });
    const idsKuzzle = listKuzzle.result.models.map(
      (m: { _id: string }) => m._id,
    );
    expect(idsKuzzle).toContain(
      "model-asset-air_quality-engine-ayse+engine-kuzzle-SharedTenant",
    );
  });
});
