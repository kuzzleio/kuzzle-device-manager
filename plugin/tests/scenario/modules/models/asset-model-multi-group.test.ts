import { vi } from "vitest";
import { setupHooks } from "../../../helpers";

vi.setConfig({ testTimeout: 30000 });

describe("ModelsController:assets:multi-group", () => {
  const sdk = setupHooks();

  it("Write model with multiple engineGroups produces multi-group ID", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality", "public_lighting"],
        model: "MultiGroupSensor",
        metadataMappings: { location: { type: "keyword" } },
        measures: [{ name: "temperatureExt", type: "temperature" }],
      },
    });

    const doc = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-air_quality+public_lighting-MultiGroupSensor",
    );

    expect(doc._source).toMatchObject({
      type: "asset",
      engineGroups: ["air_quality", "public_lighting"],
      asset: {
        model: "MultiGroupSensor",
        metadataMappings: { location: { type: "keyword" } },
        measures: [{ name: "temperatureExt", type: "temperature" }],
      },
    });
    expect(doc._source).not.toHaveProperty("engines");
  });

  it("Multi-group ID is sorted alphabetically", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["public_lighting", "air_quality"],
        model: "SortedGroup",
        metadataMappings: {},
        measures: [],
      },
    });

    // Groups are sorted alphabetically in the ID
    const doc = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-air_quality+public_lighting-SortedGroup",
    );

    expect(doc._id).toBe("model-asset-air_quality+public_lighting-SortedGroup");
  });

  it("Commons normalization: engineGroups containing 'commons' is normalized to ['commons']", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["commons", "air_quality"],
        model: "CommonsNormalized",
        metadataMappings: {},
        measures: [],
      },
    });

    // Should be stored with just ["commons"] and use simple ID format
    const doc = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-CommonsNormalized",
    );

    expect(doc._source.engineGroups).toEqual(["commons"]);
    expect(doc._id).toBe("model-asset-CommonsNormalized");
  });

  it("Single-group model still uses simple ID format", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality"],
        model: "SingleGroupCompat",
        metadataMappings: {},
        measures: [],
      },
    });

    const doc = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-SingleGroupCompat",
    );

    expect(doc._id).toBe("model-asset-SingleGroupCompat");
    expect(doc._source.engineGroups).toEqual(["air_quality"]);
  });

  it("List from one group returns multi-group models that include that group", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality", "public_lighting"],
        model: "CrossGroup",
        metadataMappings: {},
        measures: [],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    // List from air_quality should include the multi-group model
    const listAQ = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroups: ["air_quality"],
    });
    const idsAQ = listAQ.result.models.map((m: { _id: string }) => m._id);
    expect(idsAQ).toContain(
      "model-asset-air_quality+public_lighting-CrossGroup",
    );

    // List from public_lighting should also include it
    const listPL = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroups: ["public_lighting"],
    });
    const idsPL = listPL.result.models.map((m: { _id: string }) => m._id);
    expect(idsPL).toContain(
      "model-asset-air_quality+public_lighting-CrossGroup",
    );
  });

  it("getAsset resolves multi-group model when queried from either group", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality", "public_lighting"],
        model: "SharedModel",
        metadataMappings: { scope: { type: "keyword" } },
        defaultValues: { scope: "multi" },
        measures: [],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    // Get from air_quality
    const resultAQ = await sdk.query({
      controller: "device-manager/models",
      action: "getAsset",
      engineGroups: ["air_quality"],
      model: "SharedModel",
    });
    expect(resultAQ.result._source.engineGroups).toEqual([
      "air_quality",
      "public_lighting",
    ]);
    expect(resultAQ.result._source.asset.model).toBe("SharedModel");

    // Get from public_lighting
    const resultPL = await sdk.query({
      controller: "device-manager/models",
      action: "getAsset",
      engineGroups: ["public_lighting"],
      model: "SharedModel",
    });
    expect(resultPL.result._source.engineGroups).toEqual([
      "air_quality",
      "public_lighting",
    ]);
    expect(resultPL.result._source.asset.model).toBe("SharedModel");
  });

  it("Multi-group model with engines uses full composite ID", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroups: ["air_quality", "public_lighting"],
        model: "MultiGroupTenant",
        metadataMappings: {},
        measures: [],
        engines: ["engine-ayse"],
      },
    });

    const doc = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-air_quality+public_lighting-engine-ayse-MultiGroupTenant",
    );

    expect(doc._source).toMatchObject({
      type: "asset",
      engineGroups: ["air_quality", "public_lighting"],
      engines: ["engine-ayse"],
      asset: { model: "MultiGroupTenant" },
    });
  });
});
