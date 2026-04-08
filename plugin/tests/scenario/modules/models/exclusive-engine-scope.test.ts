import { setupHooks } from "../../../helpers";

describe("ModelsController:writeAsset:exclusiveEngineScope (KZLPRD-1192)", () => {
  const sdk = setupHooks();

  it("should reject writeAsset when both engineIds and engineGroups are provided", async () => {
    let error: { status?: number; message?: string } | undefined;
    try {
      await sdk.query({
        controller: "device-manager/models",
        action: "writeAsset",
        body: {
          engineGroups: ["commons"],
          engineIds: ["engine-ayse"],
          model: "ExclusiveScopeRejected",
          metadataMappings: {},
          measures: [],
        },
      });
    } catch (e) {
      error = e as { status?: number; message?: string };
    }
    expect(error).toBeDefined();
    expect(error?.status).toBe(400);
    expect(error?.message).toMatch(/mutually exclusive/);
  });

  it("should accept tenant-scoped writeAsset (engineIds only)", async () => {
    const result = await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineIds: ["engine-ayse"],
        model: "ExclusiveScopeTenant",
        metadataMappings: {},
        measures: [],
      },
    });
    expect(result.result._source.engineIds).toEqual(["engine-ayse"]);
  });

  it("should accept group-scoped writeAsset (engineGroups only)", async () => {
    const result = await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["asset_tracking"],
        model: "ExclusiveScopeGroup",
        metadataMappings: {},
        measures: [],
      },
    });
    expect(result.result._source.engineGroups).toEqual(["asset_tracking"]);
    expect(result.result._source.engineIds).toBeUndefined();
  });
});
