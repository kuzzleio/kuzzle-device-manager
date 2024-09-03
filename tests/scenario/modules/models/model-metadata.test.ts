import { AssetContent } from "lib/modules/asset";
import {
  ApiModelWriteAssetRequest,
  AssetModelContent,
  MeasureModelContent,
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
<<<<<<< HEAD
          readOnly: true,
=======
          definition: {
            readOnly: true,
            type: "string",
            values: ["red", "blue"],
            customValueAllowed: true,
          },
          datetime: {
            date: true,
            time: true,
          },
>>>>>>> e11d684 (feat(metadata): add optional date and time propertiesin metadata details)
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
      metadataMappings: { network: { type: "keyword" } },
      metadataDetails: {
        company: {
          group: "companyInfo",
          locales: {
            en: {
              friendlyName: "Manufacturer",
              description: "The company that manufactured Zigbee",
            },
            fr: {
              friendlyName: "Fabricant",
              description: "L'entreprise qui a fabriqué Zigbee",
            },
          },
<<<<<<< HEAD
          readOnly: true,
=======
          definition: {
            readOnly: true,
            type: "string",
            values: ["red", "blue"],
            customValueAllowed: true,
          },
          datetime: {
            date: true,
            time: true,
          },
>>>>>>> e11d684 (feat(metadata): add optional date and time propertiesin metadata details)
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

  it("Create an asset with default metadata values", async () => {
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
        defaultValues: { "person.company": "Firebird" },
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
