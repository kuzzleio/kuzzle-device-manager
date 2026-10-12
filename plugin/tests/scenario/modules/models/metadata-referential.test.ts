import { vi } from "vitest";
import { EditorHintEnum } from "../../../../lib/modules/model";
import { setupHooks } from "../../../helpers";

vi.setConfig({ testTimeout: 30000 });

/**
 * ES mappings only grow and the hooks only reset the referential document:
 * every test uses its own metadata names.
 */
describe("ModelsController:metadata-referential", () => {
  const sdk = setupHooks();

  async function writeMetadata(name: string, body: object) {
    return sdk.query({
      controller: "device-manager/models",
      action: "writeMetadata",
      name,
      body,
    });
  }

  async function writeAsset(model: string, body: object) {
    return sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: { engineGroups: ["commons"], model, measures: [], ...body },
    });
  }

  async function getMetadataMappings(index: string, collection: string) {
    const mappings: any = await sdk.collection.getMapping(index, collection);

    return mappings.properties.metadata.properties;
  }

  it("Enriches the referential metadata of a model registered from code", async () => {
    const { _source } = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-Pole",
    );

    expect(_source.asset.metadataMappings).toEqual({
      height: { type: "integer" },
      serialNumber: { referential: true },
      manufacturer: { referential: true },
      operatingStatus: { referential: true },
    });
    expect(_source.asset.metadataDetails).toEqual({
      serialNumber: {
        locales: {
          en: { friendlyName: "Serial number", description: "Serial number" },
          fr: {
            friendlyName: "Numéro de série",
            description: "Numéro de série",
          },
        },
      },
      manufacturer: {
        locales: {
          en: { friendlyName: "Pole maker", description: "Pole maker" },
          fr: { friendlyName: "Fabricant", description: "Fabricant" },
        },
      },
      operatingStatus: {
        group: "state",
        editorHint: {
          type: EditorHintEnum.OPTION_SELECTOR,
          values: ["active", "inactive"],
        },
        locales: {
          en: { friendlyName: "Status", description: "Operating status" },
          fr: {
            friendlyName: "Statut",
            description: "Statut de fonctionnement",
          },
        },
      },
    });
    expect(_source.asset.defaultMetadata).toEqual({
      operatingStatus: "inactive",
    });

    await expect(
      getMetadataMappings("engine-other-group", "assets"),
    ).resolves.toMatchObject({
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
  });

  it("Merges the referential into the assets, devices and groups collections of every engine", async () => {
    for (const index of [
      "engine-ayse",
      "engine-kuzzle",
      "engine-other-group",
    ]) {
      for (const collection of ["assets", "devices", "groups"]) {
        await expect(
          getMetadataMappings(index, collection),
        ).resolves.toMatchObject({
          serialNumber: { type: "keyword" },
          installationPosition: { type: "geo_point" },
        });
      }
    }

    const measures: any = await sdk.collection.getMapping(
      "engine-ayse",
      "measures",
    );

    expect(
      measures.properties.asset.properties.metadata.properties,
    ).toMatchObject({ serialNumber: { type: "keyword" } });
  });

  it("Creates assets with the default values of the referential metadata", async () => {
    const { result } = await sdk.query({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-other-group",
      body: {
        model: "Pole",
        reference: "pole-1",
        metadata: { serialNumber: "SN-42" },
      },
    });

    expect(result._source.metadata).toMatchObject({
      height: null,
      serialNumber: "SN-42",
      operatingStatus: "inactive",
    });
  });

  it("Returns the metadata referential", async () => {
    const { result } = await sdk.query({
      controller: "device-manager/models",
      action: "getMetadataReferential",
    });

    expect(Object.keys(result).sort()).toEqual([
      "installationPosition",
      "manufacturer",
      "operatingStatus",
      "serialNumber",
    ]);
    expect(result.operatingStatus).toMatchObject({
      mappings: { type: "keyword" },
      defaultValue: "active",
    });
  });

  it("Rejects a model using an unknown or malformed referential metadata", async () => {
    await expect(
      writeAsset("UnknownRefPlane", {
        metadataMappings: { unknownMetadata: { referential: true } },
      }),
    ).rejects.toThrow(
      'The asset model "UnknownRefPlane" uses the unknown referential metadata "unknownMetadata"',
    );

    await expect(
      writeAsset("MalformedRefPlane", {
        metadataMappings: {
          serialNumber: { referential: true, type: "integer" },
        },
      }),
    ).rejects.toThrow(
      'The metadata "serialNumber" of asset model "MalformedRefPlane" must be { referential: true }',
    );
  });

  it("Rejects an inline metadata conflicting with the referential", async () => {
    await expect(
      writeAsset("ConflictPlane", {
        metadataMappings: { serialNumber: { type: "integer" } },
      }),
    ).rejects.toMatchObject({
      message:
        'Metadata of asset model "ConflictPlane" conflict with the metadata referential',
      status: 409,
    });

    await expect(
      writeAsset("ConflictObjectPlane", {
        metadataMappings: {
          manufacturer: {
            properties: {
              name: { type: "keyword" },
              country: { type: "keyword" },
              city: { type: "keyword" },
            },
          },
        },
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("Accepts an inline metadata identical to the referential (legacy)", async () => {
    const { result } = await writeAsset("LegacyPlane", {
      metadataMappings: { serialNumber: { type: "keyword" } },
    });

    expect(result._source.asset.metadataMappings).toEqual({
      serialNumber: { type: "keyword" },
    });
  });

  it("Enriches the referential metadata of a model written through the API", async () => {
    const { result } = await writeAsset("RefPlane", {
      metadataMappings: {
        wings: { type: "integer" },
        serialNumber: { referential: true },
        operatingStatus: { referential: true },
      },
      metadataDetails: {
        operatingStatus: {
          locales: { en: { friendlyName: "State", description: "" } },
        },
      },
    });

    expect(result._source.asset).toMatchObject({
      metadataMappings: {
        wings: { type: "integer" },
        serialNumber: { referential: true },
        operatingStatus: { referential: true },
      },
      defaultMetadata: { operatingStatus: "active" },
      metadataDetails: {
        operatingStatus: {
          editorHint: { type: EditorHintEnum.OPTION_SELECTOR },
          locales: {
            en: { friendlyName: "State", description: "" },
            fr: { friendlyName: "Statut" },
          },
        },
      },
    });

    // ? Sending back the enriched model keeps it unchanged
    const { result: rewritten } = await writeAsset("RefPlane", {
      metadataMappings: result._source.asset.metadataMappings,
      metadataDetails: result._source.asset.metadataDetails,
      defaultValues: result._source.asset.defaultMetadata,
    });

    expect(rewritten._source.asset).toMatchObject({
      defaultMetadata: result._source.asset.defaultMetadata,
      metadataDetails: result._source.asset.metadataDetails,
      metadataMappings: result._source.asset.metadataMappings,
    });
  });

  it("Lets a model override the default value, icon and group of a referential metadata", async () => {
    await writeMetadata("refWingspan", {
      mappings: { type: "float" },
      icon: "plane",
      defaultValue: 10,
    });

    const { result } = await writeAsset("IconJet", {
      metadataMappings: { refWingspan: { referential: true } },
      metadataDetails: {
        refWingspan: { icon: "jet-fighter", group: "size", locales: {} },
      },
      defaultValues: { refWingspan: 12 },
    });

    expect(result._source.asset.metadataDetails.refWingspan).toEqual({
      group: "size",
      icon: "jet-fighter",
      locales: {},
    });
    expect(result._source.asset.defaultMetadata).toEqual({ refWingspan: 12 });
  });

  it("Merges partial model locales over the referential ones", async () => {
    const { result } = await writeAsset("RefGlider", {
      metadataMappings: { serialNumber: { referential: true } },
      metadataDetails: {
        serialNumber: {
          locales: {
            en: { description: "Glider serial" },
            de: { friendlyName: "Seriennummer" },
          },
        },
      },
    });

    expect(result._source.asset.metadataDetails.serialNumber.locales).toEqual({
      en: { friendlyName: "Serial number", description: "Glider serial" },
      fr: { friendlyName: "Numéro de série", description: "Numéro de série" },
      de: { friendlyName: "Seriennummer", description: "" },
    });
  });

  it("Merges a new metadata into the collections of every engine", async () => {
    await writeMetadata("refFuel", {
      mappings: { properties: { kind: { type: "keyword" } } },
      locales: { en: { friendlyName: "Fuel", description: "" } },
    });

    for (const collection of ["assets", "devices", "groups"]) {
      await expect(
        getMetadataMappings("engine-ayse", collection),
      ).resolves.toMatchObject({
        refFuel: { properties: { kind: { type: "keyword" } } },
      });
    }
  });

  it("Updates the details of a metadata but not its mappings", async () => {
    await writeMetadata("refCargo", {
      mappings: { type: "keyword" },
      icon: "box",
    });

    const { result } = await writeMetadata("refCargo", {
      mappings: { type: "keyword" },
      icon: "boxes",
      locales: { en: { friendlyName: "Cargo", description: "" } },
    });

    expect(result.refCargo).toMatchObject({
      icon: "boxes",
      locales: { en: { friendlyName: "Cargo" } },
    });

    await expect(
      writeMetadata("refCargo", { mappings: { type: "integer" } }),
    ).rejects.toThrow(
      'The mappings of metadata "refCargo" cannot be modified, they are already merged into the engines collections',
    );
    await expect(
      writeMetadata("refCargo", {
        mappings: { properties: { kind: { type: "keyword" } } },
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("Marks the metadata registered from code as managed and protects them", async () => {
    const { result: referential } = await sdk.query({
      controller: "device-manager/models",
      action: "getMetadataReferential",
    });

    expect(referential.serialNumber.managed).toBe(true);

    await expect(
      writeMetadata("serialNumber", { mappings: { type: "keyword" } }),
    ).rejects.toThrow(/registered from code, it cannot be modified/);
    await expect(
      sdk.query({
        controller: "device-manager/models",
        action: "deleteMetadata",
        name: "serialNumber",
      }),
    ).rejects.toThrow(/registered from code, it cannot be modified/);

    // ? A metadata written through the API cannot be flagged managed
    const { result: written } = await writeMetadata("refHullColor", {
      mappings: { type: "keyword" },
      managed: true,
    });
    expect(written.refHullColor).not.toHaveProperty("managed");
  });

  it("Rejects a metadata conflicting with an inline metadata of a model", async () => {
    await writeAsset("InlinePlane", {
      metadataMappings: { refRegistration: { type: "keyword" } },
    });

    await expect(
      writeMetadata("refRegistration", { mappings: { type: "integer" } }),
    ).rejects.toMatchObject({
      message:
        'Metadata "refRegistration" conflicts with the metadata of models',
      status: 409,
    });
  });

  it("Rejects a metadata conflicting with the actual mappings of a collection", async () => {
    // ? The model is deleted but its mappings stay in the engines collections
    await writeAsset("DeletedPlane", {
      metadataMappings: { refTail: { type: "keyword" } },
    });
    await sdk.query({
      controller: "device-manager/models",
      action: "deleteAsset",
      _id: "model-asset-DeletedPlane",
    });
    await sdk.collection.refresh("device-manager", "models");

    await expect(
      writeMetadata("refTail", { mappings: { type: "integer" } }),
    ).rejects.toMatchObject({
      message:
        'Metadata "refTail" conflicts with the engines collections mappings',
      status: 409,
    });

    // ? A value cannot become an object
    await expect(
      writeMetadata("refTail", {
        mappings: { properties: { code: { type: "keyword" } } },
      }),
    ).rejects.toMatchObject({ status: 409 });

    const { result } = await sdk.query({
      controller: "device-manager/models",
      action: "getMetadataReferential",
    });

    expect(result.refTail).toBeUndefined();
  });

  it("Rejects a model conflicting with the actual mappings of a collection", async () => {
    await writeAsset("FormerPlane", {
      metadataMappings: { refNose: { type: "keyword" } },
    });
    await sdk.query({
      controller: "device-manager/models",
      action: "deleteAsset",
      _id: "model-asset-FormerPlane",
    });
    await sdk.collection.refresh("device-manager", "models");

    await expect(
      writeAsset("NextPlane", {
        metadataMappings: {
          refNose: { properties: { a: { type: "keyword" } } },
        },
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("Rejects an invalid referential entry", async () => {
    await expect(writeMetadata("invalid", { mappings: {} })).rejects.toThrow(
      'Metadata "invalid" mappings must define either a "type" or "properties"',
    );
    await expect(
      writeMetadata("in.valid", { mappings: { type: "keyword" } }),
    ).rejects.toThrow('Metadata name "in.valid" is invalid');
  });

  it("Deletes a metadata only when no model uses it", async () => {
    await writeMetadata("refSeats", { mappings: { type: "integer" } });
    await writeAsset("SeatsPlane", {
      metadataMappings: { refSeats: { referential: true } },
    });

    await expect(
      sdk.query({
        controller: "device-manager/models",
        action: "deleteMetadata",
        name: "refSeats",
      }),
    ).rejects.toThrow(
      'Metadata "refSeats" is still used by the models: model-asset-SeatsPlane',
    );

    await sdk.query({
      controller: "device-manager/models",
      action: "deleteAsset",
      _id: "model-asset-SeatsPlane",
    });
    await sdk.collection.refresh("device-manager", "models");

    const { result } = await sdk.query({
      controller: "device-manager/models",
      action: "deleteMetadata",
      name: "refSeats",
    });

    expect(result.refSeats).toBeUndefined();
  });

  async function getReferential() {
    const { result } = await sdk.query({
      controller: "device-manager/models",
      action: "getMetadataReferential",
    });

    return result;
  }

  async function writeAndDeleteModel(
    type: "device" | "group",
    model: string,
    metadataMappings: object,
  ) {
    const body =
      type === "device"
        ? { model, measures: [], metadataMappings }
        : {
            engineGroups: ["commons"],
            model,
            metadataMappings,
            affinity: {
              type: ["assets"],
              models: { assets: ["Container"], devices: [] },
              strict: true,
            },
          };

    await sdk.query({
      controller: "device-manager/models",
      action: type === "device" ? "writeDevice" : "writeGroup",
      body,
    });
    await sdk.query({
      controller: "device-manager/models",
      action: type === "device" ? "deleteDevice" : "deleteGroup",
      _id: `model-${type}-${model}`,
    });
    await sdk.collection.refresh("device-manager", "models");
  }

  it("Restores the referential when Elasticsearch rejects a new metadata", async () => {
    await expect(
      writeMetadata("refBadType", { mappings: { type: "notAType" } }),
    ).rejects.toThrow(/No handler for type \[notAType\]/);

    await expect(getReferential()).resolves.not.toHaveProperty("refBadType");

    // ? The next engines updates are not affected
    await expect(
      writeMetadata("refAfterBadType", { mappings: { type: "keyword" } }),
    ).resolves.toBeDefined();
  });

  it("Restores a model rejected by Elasticsearch", async () => {
    await expect(
      writeAsset("BadTypePlane", {
        metadataMappings: { refBadModelType: { type: "notAType" } },
      }),
    ).rejects.toThrow(/No handler for type \[notAType\]/);

    await expect(
      sdk.document.exists(
        "device-manager",
        "models",
        "model-asset-BadTypePlane",
      ),
    ).resolves.toBe(false);

    await writeAsset("BadUpdatePlane", {
      metadataMappings: { refGoodType: { type: "keyword" } },
    });

    await expect(
      sdk.query({
        controller: "device-manager/models",
        action: "updateAsset",
        engineGroups: ["commons"],
        model: "BadUpdatePlane",
        body: {
          metadataMappings: {
            refGoodType: { type: "keyword" },
            refBadUpdateType: { type: "notAType" },
          },
        },
      }),
    ).rejects.toThrow(/No handler for type \[notAType\]/);

    const { _source } = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-BadUpdatePlane",
    );

    expect(_source.asset.metadataMappings).toEqual({
      refGoodType: { type: "keyword" },
    });

    await expect(
      writeAsset("AfterBadTypePlane", {
        metadataMappings: { refAfterBadModel: { type: "keyword" } },
      }),
    ).resolves.toBeDefined();
  });

  it("Serializes a metadata and a model written concurrently with conflicting mappings", async () => {
    const [metadata, asset] = await Promise.allSettled([
      writeMetadata("refRace", { mappings: { type: "keyword" } }),
      writeAsset("RacePlane", {
        metadataMappings: { refRace: { type: "integer" } },
      }),
    ]);

    // ? The second write sees the first one and is rejected by the conflicts checks
    const rejected = [metadata, asset].filter(
      ({ status }) => status === "rejected",
    ) as PromiseRejectedResult[];

    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.status).toBe(409);
  });

  it("Rejects device and group models conflicting with the actual mappings of a collection", async () => {
    await writeAndDeleteModel("device", "FormerSensor", {
      refDeviceLeft: { type: "keyword" },
    });

    await expect(
      sdk.query({
        controller: "device-manager/models",
        action: "writeDevice",
        body: {
          model: "NextSensor",
          measures: [],
          metadataMappings: { refDeviceLeft: { type: "integer" } },
        },
      }),
    ).rejects.toMatchObject({ status: 409 });

    await writeAndDeleteModel("group", "FormerFleet", {
      refGroupLeft: { type: "keyword" },
    });

    await expect(
      sdk.query({
        controller: "device-manager/models",
        action: "writeGroup",
        body: {
          engineGroups: ["commons"],
          model: "NextFleet",
          affinity: {
            type: ["assets"],
            models: { assets: ["Container"], devices: [] },
            strict: true,
          },
          metadataMappings: {
            refGroupLeft: { properties: { a: { type: "keyword" } } },
          },
        },
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
});
