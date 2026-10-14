import { setupHooks } from "../../../helpers";

describe("ModelsController:listAssets:validation", () => {
  const sdk = setupHooks();

  it("should return all models for admin without tenantClasses", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        tenantClasses: ["commons"],
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
        tenantClasses: ["commons"],
        model: "CommonsIncludeTest",
        metadataMappings: {},
        measures: [],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const result = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      tenantClasses: ["asset_tracking"],
    });

    const modelNames = result.result.models.map(
      (m: { _source: { asset: { model: string } } }) => m._source.asset.model,
    );
    expect(modelNames).toContain("CommonsIncludeTest");
  });

  it("admin with tenantClasses should also get commons", async () => {
    await sdk.auth.login("local", {
      username: "test-admin",
      password: "password",
    });

    const result = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      tenantClasses: ["asset_tracking"],
    });

    const groups = result.result.models.flatMap(
      (m: { _source: { tenantClasses: string[] } }) =>
        m._source.tenantClasses || [],
    );
    expect(groups).toContain("commons");

    sdk.jwt = null;
  });

  it("admin with invalid index should still work (admin bypasses validation)", async () => {
    // Reuse admin JWT from previous test or login fresh
    if (!sdk.jwt) {
      await new Promise((r) => setTimeout(r, 1500)); // Rate limit cooldown
      await sdk.auth.login("local", {
        username: "test-admin",
        password: "password",
      });
    }

    // Admin should not get 404 for invalid index — validation is skipped
    const result = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      tenantClasses: ["commons"],
      index: "nonexistent-engine",
    });

    expect(result.result.total).toBeGreaterThanOrEqual(0);

    sdk.jwt = null;
  });
});
