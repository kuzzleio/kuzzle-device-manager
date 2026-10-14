import { vi } from "vitest";
import { EditorHintEnum } from "../../../../lib/modules/model";
import { setupHooks } from "../../../helpers";

vi.setConfig({ testTimeout: 30000 });

describe("ModelsController:get, list and search models referential resolution", () => {
  const sdk = setupHooks();

  async function getModel(action: string, model: string, args: object = {}) {
    const { result } = await sdk.query({
      controller: "device-manager/models",
      action,
      model,
      ...args,
    });

    return result;
  }

  it("Resolves the referential metadata of an asset model by default", async () => {
    const { _source } = await getModel("getAsset", "Pole", {
      tenantClasses: ["other-group"],
    });

    expect(_source.asset.metadataMappings).toEqual({
      height: { type: "integer" },
      serialNumber: { type: "keyword" },
      manufacturer: {
        properties: {
          name: { type: "keyword" },
          country: { type: "keyword" },
        },
      },
      operatingStatus: { type: "keyword" },
    });
    expect(_source.asset.metadataDetails.operatingStatus).toEqual({
      group: "state",
      editorHint: {
        type: EditorHintEnum.OPTION_SELECTOR,
        values: ["active", "inactive"],
      },
      locales: {
        en: { friendlyName: "Status", description: "Operating status" },
        fr: { friendlyName: "Statut", description: "Statut de fonctionnement" },
      },
    });
    expect(_source.asset.defaultMetadata).toEqual({
      operatingStatus: "inactive",
    });
  });

  it("Returns the stored asset model with rawModel", async () => {
    const { _source } = await getModel("getAsset", "Pole", {
      tenantClasses: ["other-group"],
      rawModel: true,
    });

    expect(_source.asset.metadataMappings).toEqual({
      height: { type: "integer" },
      serialNumber: { referential: true },
      manufacturer: { referential: true },
      operatingStatus: { referential: true },
    });
  });

  it("Merges the current referential values under the model ones", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeMetadata",
      name: "getResKind",
      body: { mappings: { type: "keyword" } },
    });
    await sdk.query({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "GetResSensor",
        measures: [],
        metadataMappings: { getResKind: { referential: true } },
        metadataDetails: {
          getResKind: {
            locales: { en: { friendlyName: "Kind", description: "" } },
          },
        },
      },
    });

    // ? Details added to the entry after the model was written
    await sdk.query({
      controller: "device-manager/models",
      action: "writeMetadata",
      name: "getResKind",
      body: {
        mappings: { type: "keyword" },
        icon: "tag",
        defaultValue: "generic",
        locales: { fr: { friendlyName: "Type", description: "Type" } },
      },
    });

    const resolved = await getModel("getDevice", "GetResSensor");

    expect(resolved._source.device.metadataMappings).toEqual({
      getResKind: { type: "keyword" },
    });
    expect(resolved._source.device.metadataDetails.getResKind).toEqual({
      icon: "tag",
      locales: {
        en: { friendlyName: "Kind", description: "" },
        fr: { friendlyName: "Type", description: "Type" },
      },
    });
    expect(resolved._source.device.defaultMetadata).toEqual({
      getResKind: "generic",
    });

    const raw = await getModel("getDevice", "GetResSensor", { rawModel: true });

    expect(raw._source.device.metadataMappings).toEqual({
      getResKind: { referential: true },
    });
    expect(raw._source.device.defaultMetadata).toEqual({});
  });

  it("Resolves the referential metadata of a group model", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeGroup",
      body: {
        tenantClasses: ["commons"],
        model: "GetResFleet",
        affinity: {
          type: ["assets"],
          models: { assets: ["Container"], devices: [] },
          strict: true,
        },
        metadataMappings: { serialNumber: { referential: true } },
      },
    });

    const resolved = await getModel("getGroup", "GetResFleet");
    const raw = await getModel("getGroup", "GetResFleet", { rawModel: true });

    expect(resolved._source.group.metadataMappings).toEqual({
      serialNumber: { type: "keyword" },
    });
    expect(raw._source.group.metadataMappings).toEqual({
      serialNumber: { referential: true },
    });
  });

  it("Resolves the referential metadata of listed and searched models", async () => {
    const poleMappings = (models: any[]) =>
      models.find(({ _source }) => _source.asset.model === "Pole")._source.asset
        .metadataMappings.serialNumber;

    const query = async (action: string, args: object) => {
      const { result } = await sdk.query({
        controller: "device-manager/models",
        action,
        tenantClasses: ["other-group"],
        ...args,
      });

      return result;
    };

    const listed = await query("listAssets", {});
    const listedRaw = await query("listAssets", { rawModel: true });

    expect(poleMappings(listed.models)).toEqual({ type: "keyword" });
    expect(poleMappings(listedRaw.models)).toEqual({ referential: true });

    const body = { query: { term: { "asset.model": "Pole" } } };
    const searched = await query("searchAssets", { body });
    const searchedRaw = await query("searchAssets", { body, rawModel: true });

    expect(searched.total).toBe(1);
    expect(poleMappings(searched.hits)).toEqual({ type: "keyword" });
    expect(poleMappings(searchedRaw.hits)).toEqual({ referential: true });
  });

  it("Resolves the referential metadata of listed and searched device and group models", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "ListResSensor",
        measures: [],
        metadataMappings: { serialNumber: { referential: true } },
      },
    });
    await sdk.query({
      controller: "device-manager/models",
      action: "writeGroup",
      body: {
        tenantClasses: ["commons"],
        model: "ListResFleet",
        affinity: {
          type: ["assets"],
          models: { assets: ["Container"], devices: [] },
          strict: true,
        },
        metadataMappings: { serialNumber: { referential: true } },
      },
    });
    await sdk.collection.refresh("device-manager", "models");

    const serialNumberOf = (
      documents: any[],
      type: "device" | "group",
      model: string,
    ) =>
      documents.find(({ _source }) => _source[type].model === model)._source[
        type
      ].metadataMappings.serialNumber;

    for (const [type, model, list, search] of [
      ["device", "ListResSensor", "listDevices", "searchDevices"],
      ["group", "ListResFleet", "listGroups", "searchGroups"],
    ] as const) {
      for (const rawModel of [false, true]) {
        const expected = rawModel ? { referential: true } : { type: "keyword" };
        const { result: listed } = await sdk.query({
          controller: "device-manager/models",
          action: list,
          tenantClasses: ["commons"],
          rawModel,
        });
        const { result: searched } = await sdk.query({
          controller: "device-manager/models",
          action: search,
          tenantClasses: ["commons"],
          rawModel,
          body: { query: { term: { [`${type}.model`]: model } } },
        });

        expect(serialNumberOf(listed.models, type, model)).toEqual(expected);
        expect(serialNumberOf(searched.hits, type, model)).toEqual(expected);
      }
    }
  });
});
