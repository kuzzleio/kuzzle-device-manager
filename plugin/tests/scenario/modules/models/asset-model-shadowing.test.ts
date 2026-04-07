import { vi } from "vitest";
import { setupHooks } from "../../../helpers";

vi.setConfig({ testTimeout: 30000 });

/**
 * Anti-shadowing: the same asset model name cannot exist at different scope levels.
 */
describe("ModelsController:assets:anti-shadowing", () => {
  const sdk = setupHooks();

  it("should reject tenant-scoped model when global model with same name exists", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["commons"],
        model: "ShadowTestGlobal",
        metadataMappings: {},
        measures: [],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const tenantScoped = sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineIds: ["engine-ayse"],
        model: "ShadowTestGlobal",
        metadataMappings: {},
        measures: [],
      },
    });

    await expect(tenantScoped).rejects.toThrow(
      /already exists as a global \(commons\) model/,
    );
  });

  it("should reject global model when group-scoped model with same name exists", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality"],
        model: "ShadowTestGroup",
        metadataMappings: {},
        measures: [],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const globalModel = sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["commons"],
        model: "ShadowTestGroup",
        metadataMappings: {},
        measures: [],
      },
    });

    await expect(globalModel).rejects.toThrow(
      /already exists at a non-global scope/,
    );
  });

  it("should reject tenant-scoped model when group-scoped model with same name exists", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality"],
        model: "ShadowTestGroupToTenant",
        metadataMappings: {},
        measures: [],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const tenantScoped = sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineIds: ["engine-ayse"],
        model: "ShadowTestGroupToTenant",
        metadataMappings: {},
        measures: [],
      },
    });

    await expect(tenantScoped).rejects.toThrow(/already exists at group scope/);
  });

  it("should allow same-scope overwrite (createOrReplace)", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality"],
        model: "ShadowTestSameScope",
        metadataMappings: { field1: { type: "keyword" } },
        measures: [],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    // Same scope, same name: should succeed (overwrite)
    const result = await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality"],
        model: "ShadowTestSameScope",
        metadataMappings: {
          field1: { type: "keyword" },
          field2: { type: "integer" },
        },
        measures: [],
      },
    });

    expect(result.result._id).toBe("model-asset-ShadowTestSameScope");
  });
});
