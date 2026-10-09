import { vi } from "vitest";
import { EditorHintEnum } from "../../../../lib/modules/model";
import { setupHooks } from "../../../helpers";

vi.setConfig({ testTimeout: 30000 });

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

  it("Resolves the referenced metadata of a model registered from code", async () => {
    const { _source } = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-Pole",
    );

    expect(_source.asset.metadataReferences).toEqual({
      serialNumber: true,
      manufacturer: {
        locales: {
          en: { friendlyName: "Pole maker", description: "Pole maker" },
        },
      },
      operatingStatus: { defaultValue: "inactive", group: "state" },
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

    const mappings = await sdk.collection.getMapping(
      "engine-other-group",
      "assets",
    );

    expect(mappings.properties.metadata.properties).toMatchObject({
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

  it("Creates assets with the default values of the referenced metadata", async () => {
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

  it("Rejects a model referencing an unknown metadata", async () => {
    await expect(
      writeAsset("UnknownRefPlane", { metadata: { unknownMetadata: true } }),
    ).rejects.toThrow(
      'The asset model "UnknownRefPlane" references the unknown metadata "unknownMetadata"',
    );
  });

  it("Rejects an inline metadata conflicting with the referential", async () => {
    await expect(
      writeAsset("ConflictPlane", {
        metadataMappings: { serialNumber: { type: "integer" } },
      }),
    ).rejects.toMatchObject({
      message:
        'Metadata "serialNumber" of asset model "ConflictPlane" conflicts with the metadata referential',
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
    expect(result._source.asset.metadataReferences).toEqual({});
  });

  it("Resolves the metadata references of a model written through the API", async () => {
    const { result } = await writeAsset("RefPlane", {
      metadataMappings: { wings: { type: "integer" } },
      metadata: {
        serialNumber: true,
        operatingStatus: {
          locales: { en: { friendlyName: "State", description: "" } },
        },
      },
    });

    expect(result._source.asset).toMatchObject({
      metadataMappings: {
        wings: { type: "integer" },
        serialNumber: { type: "keyword" },
        operatingStatus: { type: "keyword" },
      },
      defaultMetadata: { operatingStatus: "active" },
      metadataDetails: {
        operatingStatus: {
          locales: {
            en: { friendlyName: "State", description: "" },
            fr: { friendlyName: "Statut" },
          },
        },
      },
    });
  });

  it("Merges partial reference locales over the referential ones", async () => {
    const { result } = await writeAsset("RefGlider", {
      metadata: {
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

  it("Keeps the metadata references when updating a model without them", async () => {
    await writeAsset("UpdatePlane", { metadata: { serialNumber: true } });

    const { result } = await sdk.query({
      controller: "device-manager/models",
      action: "updateAsset",
      engineGroups: ["commons"],
      model: "UpdatePlane",
      body: { metadataMappings: { wings: { type: "integer" } } },
    });

    expect(result._source.asset.metadataReferences).toEqual({
      serialNumber: true,
    });
    expect(result._source.asset.metadataMappings).toEqual({
      wings: { type: "integer" },
      serialNumber: { type: "keyword" },
    });
  });

  it("Propagates a referential update to the referencing models", async () => {
    await writeMetadata("fuel", {
      mappings: { properties: { type: { type: "keyword" } } },
      locales: { en: { friendlyName: "Fuel", description: "" } },
    });
    await writeAsset("FuelPlane", { metadata: { fuel: true } });

    await writeMetadata("fuel", {
      mappings: {
        properties: {
          type: { type: "keyword" },
          capacity: { type: "integer" },
        },
      },
      locales: { en: { friendlyName: "Fuel tank", description: "" } },
    });

    const { _source } = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-FuelPlane",
    );

    expect(_source.asset.metadataMappings.fuel).toEqual({
      properties: {
        type: { type: "keyword" },
        capacity: { type: "integer" },
      },
    });
    expect(_source.asset.metadataDetails.fuel.locales.en.friendlyName).toBe(
      "Fuel tank",
    );

    const mappings = await sdk.collection.getMapping("engine-ayse", "assets");

    expect(mappings.properties.metadata.properties.fuel).toEqual({
      properties: {
        type: { type: "keyword" },
        capacity: { type: "integer" },
      },
    });
  });

  it("Resolves the metadata icon and lets a model override it", async () => {
    await writeMetadata("wingspan", {
      mappings: { type: "float" },
      icon: "plane",
    });
    await writeAsset("IconGlider", { metadata: { wingspan: true } });
    await writeAsset("IconJet", {
      metadata: { wingspan: { icon: "jet-fighter" } },
    });

    const getDetails = async (model: string) => {
      const { _source } = await sdk.document.get(
        "device-manager",
        "models",
        `model-asset-${model}`,
      );

      return _source.asset.metadataDetails.wingspan;
    };

    await expect(getDetails("IconGlider")).resolves.toMatchObject({
      icon: "plane",
    });
    await expect(getDetails("IconJet")).resolves.toMatchObject({
      icon: "jet-fighter",
    });

    await writeMetadata("wingspan", {
      mappings: { type: "float" },
      icon: "paper-plane",
    });

    await expect(getDetails("IconGlider")).resolves.toMatchObject({
      icon: "paper-plane",
    });
    await expect(getDetails("IconJet")).resolves.toMatchObject({
      icon: "jet-fighter",
    });
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
    const { result: written } = await writeMetadata("hullColor", {
      mappings: { type: "keyword" },
      managed: true,
    });
    expect(written.hullColor).not.toHaveProperty("managed");
  });

  it("Rejects inline details and defaults differing for a referenced metadata", async () => {
    await expect(
      writeAsset("DetailsPlane", {
        metadata: { serialNumber: true },
        metadataDetails: {
          serialNumber: {
            locales: { en: { friendlyName: "Serial", description: "" } },
          },
        },
      }),
    ).rejects.toThrow(
      /inline details of the referenced metadata "serialNumber".*differ from the resolved ones/,
    );

    await expect(
      writeAsset("DefaultPlane", {
        metadata: { operatingStatus: true },
        defaultValues: { operatingStatus: "inactive" },
      }),
    ).rejects.toThrow(
      /inline default value of the referenced metadata "operatingStatus".*differs from the resolved one/,
    );

    // ? Sending back the resolved model is accepted
    const { result } = await writeAsset("RoundTripPlane", {
      metadata: { operatingStatus: true },
    });
    const { metadataDetails, defaultMetadata } = result._source.asset;

    await expect(
      writeAsset("RoundTripPlane", {
        metadata: { operatingStatus: true },
        metadataDetails,
        defaultValues: defaultMetadata,
      }),
    ).resolves.toBeDefined();
  });

  it("Rejects a referential update conflicting with the referencing models", async () => {
    await writeMetadata("cargo", { mappings: { type: "keyword" } });
    await writeAsset("CargoPlane", { metadata: { cargo: true } });

    await expect(
      writeMetadata("cargo", { mappings: { type: "integer" } }),
    ).rejects.toThrow("New assets mappings are causing conflicts");

    const { result } = await sdk.query({
      controller: "device-manager/models",
      action: "getMetadataReferential",
    });

    expect(result.cargo.mappings).toEqual({ type: "keyword" });
  });

  it("Rejects a referential entry conflicting with an inline metadata", async () => {
    await writeAsset("InlinePlane", {
      metadataMappings: { registration: { type: "keyword" } },
    });

    await expect(
      writeMetadata("registration", { mappings: { type: "integer" } }),
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

  it("Deletes a metadata only when no model references it", async () => {
    await writeMetadata("seats", { mappings: { type: "integer" } });
    await writeAsset("SeatsPlane", { metadata: { seats: true } });

    await expect(
      sdk.query({
        controller: "device-manager/models",
        action: "deleteMetadata",
        name: "seats",
      }),
    ).rejects.toThrow(
      'Metadata "seats" is still referenced by the models: model-asset-SeatsPlane',
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
      name: "seats",
    });

    expect(result.seats).toBeUndefined();
  });
});
