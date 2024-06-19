import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";
import { ApiModelWriteAssetRequest, ApiModelWriteMeasureRequest, MeasureModelContent } from "../../../lib/modules/model";

jest.setTimeout(10000);

describe("features/Model/Controller", () => {
  const sdk = useSdk();

  beforeAll(async () => {
    await sdk.connect();
    await beforeAllCreateEngines(sdk);
  });

  beforeEach(async () => {
    await beforeEachTruncateCollections(sdk);
    await beforeEachLoadFixtures(sdk);
  });

  afterAll(async () => {
    sdk.disconnect();
  });

  it("Write and List an Asset model", async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Plane",
        metadataMappings: { company: { type: "keyword" } },
        measures: [{ name: "temperatureExt", type: "temperature" }],
      },
    });

    await expect(
      sdk.document.get("device-manager", "models", "model-asset-Plane")
    ).resolves.toMatchObject({
      _source: {
        type: "asset",
        engineGroup: "commons",
        asset: {
          model: "Plane",
          metadataMappings: { company: { type: "keyword" } },
          measures: [{ name: "temperatureExt", type: "temperature" }],
        },
      },
    });
    response = await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Plane",
        metadataMappings: {
          company: { type: "keyword" },
          company2: { type: "keyword" },
        },
        measures: [
          { name: "temperatureExt", type: "temperature" },
          { name: "position", type: "position" },
        ],
      },
    });

    await expect(
      sdk.document.get("device-manager", "models", "model-asset-Plane")
    ).resolves.toMatchObject({
      _source: {
        type: "asset",
        engineGroup: "commons",
        asset: {
          model: "Plane",
          metadataMappings: {
            company: { type: "keyword" },
            company2: { type: "keyword" },
          },
          measures: [
            { name: "temperatureExt", type: "temperature" },
            { name: "position", type: "position" },
          ],
        },
      },
    });

    response = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroup: "commons",
    });

    expect(response.result).toMatchObject({
      total: 3,
      models: [
        { _id: "model-asset-Container" },
        { _id: "model-asset-Plane" },
        { _id: "model-asset-Warehouse" },
      ],
    });

    response = await sdk.query({
      controller: "device-manager/models",
      action: "getAsset",
      engineGroup: "commons",
      model: "Plane",
    });

    expect(response.result).toMatchObject({
      _id: "model-asset-Plane",
      _source: { asset: { model: "Plane" } },
    });

    promise = sdk.query({
      controller: "device-manager/models",
      action: "getAsset",
      engineGroup: "other_engine",
      model: "Plane",
    });

    await expect(promise).rejects.toMatchObject({ status: 404 });
  });

  it("List on an engine is also returning commons assets models", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "other-group",
        model: "Car",
      },
    });
    
    const response = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroup: "other-group",
    });

    expect(response.result).toMatchObject({
      total: 4,
      models: [
        { _id: "model-asset-Car" },
        { _id: "model-asset-Container" },
        { _id: "model-asset-Plane" },
        { _id: "model-asset-Warehouse" },
      ],
    });
  });

  it("Create an asset with default metadata values", async () => {
    let response;
    let promise;

    response = await sdk.query({
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

    response = await sdk.query({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-kuzzle",
      body: { model: "Plane", reference: "Dasha31", metadata: { size: 179 } },
    });

    await expect(
      sdk.document.get("engine-kuzzle", "assets", "Plane-Dasha31")
    ).resolves.toMatchObject({
      _source: { metadata: { size: 179, person: { company: "Firebird" } } },
    });
  });

  it("Error if the model name is not PascalCase", async () => {
    let response;
    let promise;

    promise = sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "plane",
        metadataMappings: { size: { type: "integer" } },
        defaultValues: { name: "Firebird" },
      },
    });

    await expect(promise).rejects.toMatchObject({
      message: 'Asset model "plane" must be PascalCase.',
    });
  });

  it("Error if a default value is not a metadata", async () => {
    let response;
    let promise;

    promise = sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Plane",
        metadataMappings: { size: { type: "integer" } },
        defaultValues: { name: "Firebird" },
      },
    });

    await expect(promise).rejects.toMatchObject({
      message: 'The default value "name" is not in the metadata mappings.',
    });
  });

  it("Write and List a Device model", async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "Zigbee",
        measures: [{ type: "battery", name: "battery" }],
        metadataMappings: { network: { type: "keyword" } },
      },
    });

    await expect(
      sdk.document.get("device-manager", "models", "model-device-Zigbee")
    ).resolves.toMatchObject({
      _source: {
        type: "device",
        device: {
          model: "Zigbee",
          metadataMappings: { network: { type: "keyword" } },
        },
      },
    });

    response = await sdk.query({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "Zigbee",
        measures: [
          { type: "battery", name: "battery" },
          { type: "temperature", name: "temperature" },
        ],
        metadataMappings: {
          network: { type: "keyword" },
          network2: { type: "keyword" },
        },
      },
    });

    await expect(
      sdk.document.get("device-manager", "models", "model-device-Zigbee")
    ).resolves.toMatchObject({
      _source: {
        type: "device",
        device: {
          model: "Zigbee",
          metadataMappings: {
            network: { type: "keyword" },
            network2: { type: "keyword" },
          },
          measures: [
            { type: "battery", name: "battery" },
            { type: "temperature", name: "temperature" },
          ],
        },
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    await expect(
      sdk.collection.getMapping("engine-ayse", "devices")
    ).resolves.toMatchObject({
      properties: {
        metadata: {
          properties: {
            color: { type: "keyword" },
            network: { type: "keyword" },
            network2: { type: "keyword" },
          },
        },
      },
    });

    await expect(
      sdk.collection.getMapping("device-manager", "devices")
    ).resolves.toMatchObject({
      properties: {
        metadata: {
          properties: {
            color: { type: "keyword" },
            network: { type: "keyword" },
            network2: { type: "keyword" },
          },
        },
      },
    });

    response = await sdk.query({
      controller: "device-manager/models",
      action: "listDevices",
    });

    expect(response.result).toMatchObject({
      total: 3,
      models: [
        { _id: "model-device-DummyTemp" },
        { _id: "model-device-DummyTempPosition" },
        { _id: "model-device-Zigbee" },
      ],
    });

    response = await sdk.query({
      controller: "device-manager/models",
      action: "getDevice",
      model: "Zigbee",
    });

    expect(response.result).toMatchObject({
      _id: "model-device-Zigbee",
      _source: { device: { model: "Zigbee" } },
    });
  });

  it("Error if the model name is not PascalCase", async () => {
    let response;
    let promise;

    promise = sdk.query({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        engineGroup: "commons",
        model: "plane",
        metadataMappings: { size: { type: "integer" } },
        defaultValues: { name: "Firebird" },
        measures: [{ type: "temperature", name: "temperature" }],
      },
    });

    await expect(promise).rejects.toMatchObject({
      message: 'Device model "plane" must be PascalCase.',
    });
  });

  it("Write and List a Measure model", async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "presence",
        valuesMappings: { presence: { type: "boolean" } },
      },
    });

    await expect(
      sdk.document.get("device-manager", "models", "model-measure-presence")
    ).resolves.toMatchObject({
      _source: {
        type: "measure",
        measure: {
          type: "presence",
          valuesMappings: { presence: { type: "boolean" } },
        },
      },
    });

    response = await sdk.query({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "presence",
        valuesMappings: {
          presence: { type: "boolean" },
          presence2: { type: "boolean" },
        },
      },
    });

    await expect(
      sdk.document.get("device-manager", "models", "model-measure-presence")
    ).resolves.toMatchObject({
      _source: {
        type: "measure",
        measure: {
          type: "presence",
          valuesMappings: {
            presence: { type: "boolean" },
            presence2: { type: "boolean" },
          },
        },
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    await expect(
      sdk.collection.getMapping("engine-ayse", "measures")
    ).resolves.toMatchObject({
      properties: {
        values: {
          properties: {
            presence: { type: "boolean" },
            presence2: { type: "boolean" },
            accuracy: { type: "float" },
            altitude: { type: "float" },
            battery: { type: "integer" },
            humidity: { type: "float" },
            movement: { type: "boolean" },
            position: { type: "geo_point" },
            temperature: { type: "float" },
          },
        },
      },
    });

    response = await sdk.query({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "Zigbee",
        metadataMappings: {},
        measures: [{ type: "presence", name: "presence" }],
      },
    });

    await expect(
      sdk.collection.getMapping("engine-ayse", "devices")
    ).resolves.toMatchObject({
      properties: {
        measures: {
          properties: {
            presence: {
              properties: {
                measuredAt: { type: "date" },
                payloadUuids: { type: "keyword" },
                type: { type: "keyword" },
                values: {
                  properties: {
                    presence: { type: "boolean" },
                    presence2: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    });

    await expect(
      sdk.collection.getMapping("device-manager", "devices")
    ).resolves.toMatchObject({
      properties: {
        measures: {
          properties: {
            presence: {
              properties: {
                measuredAt: { type: "date" },
                payloadUuids: { type: "keyword" },
                type: { type: "keyword" },
                values: {
                  properties: {
                    presence: { type: "boolean" },
                    presence2: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    });

    response = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasures",
    });

    expect(response.result).toMatchObject({
      total: 7,
      models: [
        { _id: "model-measure-acceleration" },
        { _id: "model-measure-battery" },
        { _id: "model-measure-humidity" },
        { _id: "model-measure-movement" },
        { _id: "model-measure-position" },
        { _id: "model-measure-presence" },
        { _id: "model-measure-temperature" },
      ],
    });

    response = await sdk.query({
      controller: "device-manager/models",
      action: "getMeasure",
      type: "battery",
    });

    expect(response.result).toMatchObject({
      _id: "model-measure-battery",
      _source: { measure: { type: "battery" } },
    });
  });
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
    const response = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-AdvancedPlane"
    );
    expect(response._source.asset).toHaveProperty("metadataDetails");
    expect(response._source.asset).toHaveProperty("metadataGroups");
    delete assetModelWithDetailsAndGroups.engineGroup;
    expect(response._source).toMatchObject({
      type: "asset",
      engineGroup: "commons",
      asset: assetModelWithDetailsAndGroups,
    });
  });

  it("Register models from the framework", async () => {
    let response;
    let promise;

    await expect(
      sdk.document.get("device-manager", "models", "model-asset-Container")
    ).resolves.toMatchObject({
      _source: {
        type: "asset",
        engineGroup: "commons",
        asset: {
          model: "Container",
          metadataMappings: {
            weight: { type: "integer" },
            height: { type: "integer" },
          },
          measures: [
            { name: "temperatureExt", type: "temperature" },
            { name: "temperatureInt", type: "temperature" },
            { name: "position", type: "position" },
            { name: "temperatureWeather", type: "temperature" },
          ],
        },
      },
    });

    await expect(
      sdk.document.get("device-manager", "models", "model-asset-Warehouse")
    ).resolves.toMatchObject({
      _source: {
        type: "asset",
        engineGroup: "commons",
        asset: {
          model: "Warehouse",
          metadataMappings: { surface: { type: "integer" } },
          measures: [{ name: "position", type: "position" }],
        },
      },
    });

    await expect(
      sdk.document.get("device-manager", "models", "model-device-DummyTemp")
    ).resolves.toMatchObject({
      _source: {
        type: "device",
        device: {
          model: "DummyTemp",
          metadataMappings: { color: { type: "keyword" } },
          measures: [
            { name: "temperature", type: "temperature" },
            { name: "accelerationSensor", type: "acceleration" },
            { name: "battery", type: "battery" },
          ],
        },
      },
    });

    await expect(
      sdk.document.get("device-manager", "models", "model-measure-temperature")
    ).resolves.toMatchObject({
      _source: {
        type: "measure",
        measure: {
          type: "temperature",
          valuesMappings: { temperature: { type: "float" } },
        },
      },
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

    await expect(
      sdk.document.get<MeasureModelContent>(
        "device-manager",
        "models",
        "model-asset-Warehouse",
      ),
    ).resolves.toMatchObject({
      _source: {
        asset: {
          metadataMappings: {
            surface: {
              type: "integer"
            }
          }
        }
      }
    });
  });

  it("Should not allow changing measure metadata mappings type", async () => {
    async function query() {
      return sdk.query<ApiModelWriteMeasureRequest>({
        controller: "device-manager/models",
        action: "writeMeasure",
        body: {
          type: "temperature",
          valuesMappings: {
            temperature: {
              type: "integer",
            },
          }
        },
      });
    }

    await expect(query).rejects.toThrow();

    await expect(
      sdk.document.get<MeasureModelContent>(
        "device-manager",
        "models",
        "model-measure-temperature",
      ),
    ).resolves.toMatchObject({
      _source: {
        measure: {
          valuesMappings: {
            temperature: {
              type: "float"
            }
          }
        }
      }
    });
  });
});
