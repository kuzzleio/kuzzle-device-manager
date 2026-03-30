import { setupHooks } from "../../../helpers";

describe("ModelsController:listAssets:validation", () => {
  const sdk = setupHooks();

  it("should return all models for admin without engineGroups", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["commons"],
        model: "AdminTestModel",
        metadataMappings: {},
        measures: [],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    await sdk.auth.login("local", {
      username: "test-admin",
      password: "password",
    });

    const result = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
    });

    expect(result.result.total).toBeGreaterThanOrEqual(1);
    const types = result.result.models.map(
      (m: { _source: { type: string } }) => m._source.type,
    );
    expect(types.every((t: string) => t === "asset")).toBe(true);

    sdk.jwt = null;
  });

  it("should always include commons models alongside requested group", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["commons"],
        model: "CommonsIncludeTest",
        metadataMappings: {},
        measures: [],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const result = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroups: ["asset_tracking"],
    });

    const modelNames = result.result.models.map(
      (m: { _source: { asset: { model: string } } }) => m._source.asset.model,
    );
    expect(modelNames).toContain("CommonsIncludeTest");
  });

  it("admin with engineGroups should also get commons", async () => {
    await sdk.auth.login("local", {
      username: "test-admin",
      password: "password",
    });

    const result = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroups: ["asset_tracking"],
    });

    const groups = result.result.models.flatMap(
      (m: { _source: { engineGroups: string[] } }) =>
        m._source.engineGroups || [],
    );
    expect(groups).toContain("commons");

    sdk.jwt = null;
  });

  it("admin with invalid engineId should still work (admin bypasses validation)", async () => {
    // Reuse admin JWT from previous test or login fresh
    if (!sdk.jwt) {
      await new Promise((r) => setTimeout(r, 1500)); // Rate limit cooldown
      await sdk.auth.login("local", {
        username: "test-admin",
        password: "password",
      });
    }

    // Admin should not get 404 for invalid engineId — validation is skipped
    const result = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroups: ["commons"],
      engineId: "nonexistent-engine",
    });

    expect(result.result.total).toBeGreaterThanOrEqual(0);

    sdk.jwt = null;
  });
});
