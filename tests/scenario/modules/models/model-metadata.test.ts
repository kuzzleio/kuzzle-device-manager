import { AssetContent } from "lib/modules/asset";
import {
  ApiModelWriteAssetRequest,
  AssetModelContent,
  MeasureModelContent,
  EditorHintEnum,
} from "../../../../lib/modules/model";
import { setupSdK } from "../../../helpers";

jest.setTimeout(10000);

describe("ModelsController:metadata", () => {
  const sdk = setupSdK();

  it("Write and Retrieve an Asset model with metadata details and groups", async () => {
    const assetModelWithDetailsAndGroups = {
      engineGroup: "commons",
      model: "AdvancedPlane",
      metadataMappings: {
        company: { type: "keyword" },
        year: { type: "integer" },
      },
      measures: [{ name: "temperatureExt", type: "temperature" }],
      metadataDetails: {
        company: {
          group: "companyInfo",
          locales: {
            en: {
              friendlyName: "Manufacturer",
              description: "The company that manufactured the plane",
            },
            fr: {
              friendlyName: "Fabricant",
              description: "L'entreprise qui a fabriqué l'avion",
            },
          },
          editorHint: {
            readOnly: true,
            type: EditorHintEnum.OPTION_SELECTOR,
            values: ["red", "blue"],
            customValueAllowed: true,
          },
        },
      },
      metadataGroups: {
        companyInfo: {
          locales: {
            en: {
              groupFriendlyName: "Company Information",
              description: "All company related informations",
            },
            fr: {
              groupFriendlyName: "Informations sur l'entreprise",
              description: "Toutes les informations relatives a l'entreprise",
            },
          },
        },
      },
    };

    // Write the asset model with metadata details and groups
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: assetModelWithDetailsAndGroups,
    });

    // Retrieve and assert the asset model
    const assetModel = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-AdvancedPlane",
    );
    expect(assetModel._source.asset).toHaveProperty("metadataDetails");
    expect(assetModel._source.asset).toHaveProperty("metadataGroups");
    delete assetModelWithDetailsAndGroups.engineGroup;
    expect(assetModel._source).toMatchObject({
      type: "asset",
      engineGroup: "commons",
      asset: assetModelWithDetailsAndGroups,
    });
  });

  it("Write and Retrieve an Device model with metadata details", async () => {
    const deviceModelWithDetails = {
      model: "Zigbee",
      measures: [{ type: "battery", name: "battery" }],
      metadataMappings: {
        date: { type: "date" },
        network: { type: "keyword" },
      },
      metadataDetails: {
        date: {
          group: "dateInfo",
          locales: {
            en: {
              friendlyName: "Date",
              description: "The date when zigbee is manufactured ",
            },
            fr: {
              friendlyName: "Date",
              description: "La date the fabrication de zigbee",
            },
          },
          editorHint: {
            readOnly: false,
            type: EditorHintEnum.DATETIME,
            date: true,
            time: true,
            customTimeZoneAllowed: true,
          },
        },
        network: {
          editorHint: {
            readOnly: true,
            type: EditorHintEnum.BASE,
          },
        },
      },
    };

    // Write the device model with metadata details
    await sdk.query({
      controller: "device-manager/models",
      action: "writeDevice",
      body: deviceModelWithDetails,
    });

    // Retrieve and assert the device model
    const modelDevice = await sdk.document.get(
      "device-manager",
      "models",
      "model-device-Zigbee",
    );
    expect(modelDevice._source.device).toHaveProperty("metadataDetails");
    expect(modelDevice._source).toMatchObject({
      type: "device",
      device: deviceModelWithDetails,
    });
  });

  it("Create an asset with default metadata values for geo_point and boolean types", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Vehicle",
        metadataMappings: {
          location: { type: "geo_point" },
          boo: { type: "boolean" },
        },
        defaultValues: {
          location: {
            lat: 46.979679106275164,
            lon: 2.1093750000000004,
          },
          boo: true,
        },
      },
    });

    await sdk.query({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-kuzzle",
      body: { model: "Vehicle", reference: "Car123", metadata: { boo: true } },
    });

    const assetContent = await sdk.document.get<AssetContent>(
      "engine-kuzzle",
      "assets",
      "Vehicle-Car123",
    );
    expect(assetContent._source.metadata).toMatchObject({
      boo: true,
      location: {
        lat: 46.979679106275164,
        lon: 2.1093750000000004,
      },
    });
  });

  it("Create an asset with nested default metadata values for non-nested type", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Plane",
        metadataMappings: {
          size: { type: "integer" },
          person: { properties: { company: { type: "keyword" } } },
        },
        defaultValues: {
          person: { company: "Firebird" },
        },
      },
    });

    await sdk.query({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-kuzzle",
      body: { model: "Plane", reference: "Dasha31", metadata: { size: 179 } },
    });

    const assetContent = await sdk.document.get<AssetContent>(
      "engine-kuzzle",
      "assets",
      "Plane-Dasha31",
    );
    expect(assetContent._source.metadata).toMatchObject({
      size: 179,
      person: { company: "Firebird" },
    });
  });

  it("Should not allow to create model with incorrect nested defaultValues for non-nested type", async () => {
    const writeAsset = sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "CompanyAssetInvalid",
        metadataMappings: {
          person: { properties: { company: { type: "keyword" } } },
        },
        defaultValues: {
          person: { company: { nested: "Firebird" } },
        },
      },
    });

    await expect(writeAsset).rejects.toThrow(
      'The default value "person.company.nested" is not in the metadata mappings.',
    );
  });

  it("Should not allow to create model with defaultValues that not exist in metadata", async () => {
    const writeAsset = sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Plane",
        metadataMappings: { size: { type: "integer" } },
        defaultValues: { name: "Firebird" },
      },
    });

    await expect(writeAsset).rejects.toMatchObject({
      message: 'The default value "name" is not in the metadata mappings.',
    });
  });

  it("Should not allow changing twin metadata mappings type", async () => {
    async function query() {
      return sdk.query<ApiModelWriteAssetRequest>({
        controller: "device-manager/models",
        action: "writeAsset",
        body: {
          model: "Warehouse",
          metadataMappings: {
            surface: {
              type: "keyword",
            },
          },
          engineGroup: "commons",
        },
      });
    }

    await expect(query).rejects.toThrow();

    const modelContent = await sdk.document.get<AssetModelContent>(
      "device-manager",
      "models",
      "model-asset-Warehouse",
    );
    expect(modelContent._source.asset.metadataMappings).toMatchObject({
      surface: {
        type: "integer",
      },
    });
  });

  it("Should not allow twins to declare existent metadata with different types", async () => {
    const writeAssetQuery: ApiModelWriteAssetRequest = {
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        model: "TestHouse",
        metadataMappings: {
          surface: {
            type: "keyword",
          },
        },
        engineGroup: "commons",
      },
    };

    await expect(sdk.query(writeAssetQuery)).rejects.toThrow();

    await expect(
      sdk.document.get<MeasureModelContent>(
        "device-manager",
        "models",
        "model-asset-TestHouse",
      ),
    ).rejects.toThrow();
  });
});
