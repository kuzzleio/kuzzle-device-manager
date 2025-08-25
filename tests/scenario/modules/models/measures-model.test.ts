import { KDocument } from "kuzzle";
import {
  ApiModelListMeasuresRequest,
  ApiModelListMeasuresResult,
  ApiModelWriteAssetRequest,
  ApiModelWriteDeviceRequest,
  ApiModelWriteMeasureRequest,
  AssetModelContent,
  DeviceModelContent,
  MeasureModelContent,
} from "../../../../lib/modules/model";
import { setupHooks } from "../../../helpers";

jest.setTimeout(20000);

describe("ModelsController:measures", () => {
  const sdk = setupHooks();

  beforeAll(async () => {
    await Promise.allSettled([
      sdk.document.delete("device-manager", "models", "model-measure-light"),
    ]);
  });

  it("Write and List a Measure model", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "presence",
        valuesMappings: { presence: { type: "boolean" } },
      },
    });

    const modelContent = await sdk.document.get(
      "device-manager",
      "models",
      "model-measure-presence",
    );
    expect(modelContent._source).toMatchObject({
      type: "measure",
      measure: {
        type: "presence",
        valuesMappings: { presence: { type: "boolean" } },
      },
    });

    await sdk.query({
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

    const modelContentUpdated = await sdk.document.get(
      "device-manager",
      "models",
      "model-measure-presence",
    );
    expect(modelContentUpdated._source).toMatchObject({
      type: "measure",
      measure: {
        type: "presence",
        valuesMappings: {
          presence: { type: "boolean" },
          presence2: { type: "boolean" },
        },
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const measuresMapping = await sdk.collection.getMapping(
      "engine-ayse",
      "measures",
    );
    expect(measuresMapping.properties).toMatchObject({
      values: {
        properties: {
          presence: { type: "boolean" },
          presence2: { type: "boolean" },
          accuracy: { type: "float" },
          altitude: { type: "float" },
          battery: { type: "integer" },
          co2: { type: "float" },
          humidity: { type: "float" },
          illuminance: { type: "float" },
          lumens: { type: "float" },
          movement: { type: "boolean" },
          position: { type: "geo_point" },
          temperature: { type: "float" },
          watt: { type: "float" },
        },
      },
    });

    await sdk.query({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "Zigbee",
        metadataMappings: {},
        measures: [{ type: "presence", name: "presence" }],
      },
    });

    const listMeasures = await sdk.query<
      ApiModelListMeasuresRequest,
      ApiModelListMeasuresResult
    >({
      controller: "device-manager/models",
      action: "listMeasures",
    });

    expect(listMeasures.result.total).toBe(12);
    expect(listMeasures.result.models).toMatchObject([
      { _id: "model-measure-acceleration" },
      { _id: "model-measure-battery" },
      { _id: "model-measure-brightness" },
      { _id: "model-measure-co2" },
      { _id: "model-measure-humidity" },
      { _id: "model-measure-illuminance" },
      { _id: "model-measure-magicule" },
      { _id: "model-measure-movement" },
      { _id: "model-measure-position" },
      { _id: "model-measure-powerConsumption" },
      { _id: "model-measure-presence" },
      { _id: "model-measure-temperature" },
    ]);

    const getMeasure = await sdk.query({
      controller: "device-manager/models",
      action: "getMeasure",
      type: "battery",
    });

    expect(getMeasure.result).toMatchObject({
      _id: "model-measure-battery",
      _source: { measure: { type: "battery" } },
    });
  });

  it("Write and Search a Measure model", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "presence",
        valuesMappings: { presence: { type: "boolean" } },
      },
    });

    await sdk.query({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "movement",
        valuesMappings: {
          movement: { type: "boolean" },
        },
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const searchMeasures = await sdk.query({
      controller: "device-manager/models",
      action: "searchMeasures",
      body: {
        query: {
          match: {
            "measure.type": "presence",
          },
        },
      },
    });

    expect(searchMeasures.result).toMatchObject({
      total: 1,
      hits: [{ _id: "model-measure-presence" }],
    });
  });

  it("Register models from the framework", async () => {
    const temperatureModel = await sdk.document.get(
      "device-manager",
      "models",
      "model-measure-temperature",
    );
    expect(temperatureModel._source).toMatchObject({
      type: "measure",
      measure: {
        type: "temperature",
        valuesMappings: { temperature: { type: "float" } },
      },
    });
  });

  it("Should not allow changing measure metadata mappings type", async () => {
    const badMeasureWriteQuery: ApiModelWriteMeasureRequest = {
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "temperature",
        valuesMappings: {
          temperature: {
            type: "integer",
          },
        },
      },
    };

    await expect(sdk.query(badMeasureWriteQuery)).rejects.toThrow();

    const modelContent = await sdk.document.get<MeasureModelContent>(
      "device-manager",
      "models",
      "model-measure-temperature",
    );
    expect(modelContent._source.measure).toMatchObject({
      valuesMappings: {
        temperature: {
          type: "float",
        },
      },
    });
  });

  it("Should allow deleting metadata mappings and measures from an Asset model", async () => {
    await sdk.query<ApiModelWriteAssetRequest>({
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

    const assetModel = await sdk.document.get<AssetModelContent>(
      "device-manager",
      "models",
      "model-asset-Plane",
    );
    expect(assetModel._source).toMatchObject<AssetModelContent>({
      type: "asset",
      engineGroup: "commons",
      asset: {
        model: "Plane",
        metadataMappings: {
          company: { type: "keyword" },
          company2: { type: "keyword" },
        },
        defaultMetadata: {},
        measures: [
          { name: "temperatureExt", type: "temperature" },
          { name: "position", type: "position" },
        ],
      },
    });

    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Plane",
        metadataMappings: {
          company: { type: "keyword" },
        },
        measures: [{ name: "temperatureExt", type: "temperature" }],
      },
    });

    const assetModelUpdated = await sdk.document.get<AssetModelContent>(
      "device-manager",
      "models",
      "model-asset-Plane",
    );
    expect(assetModelUpdated._source).toMatchObject<AssetModelContent>({
      type: "asset",
      engineGroup: "commons",
      asset: {
        model: "Plane",
        metadataMappings: {
          company: { type: "keyword" },
        },
        defaultMetadata: {},
        measures: [{ name: "temperatureExt", type: "temperature" }],
      },
    });
  });

  it("Should allow deleting metadata mappings and measures from a Device model", async () => {
    await sdk.query<ApiModelWriteDeviceRequest>({
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

    const deviceModel = await sdk.document.get<DeviceModelContent>(
      "device-manager",
      "models",
      "model-device-Zigbee",
    );
    expect(deviceModel._source).toMatchObject<DeviceModelContent>({
      type: "device",
      device: {
        model: "Zigbee",
        metadataMappings: {
          network: { type: "keyword" },
          network2: { type: "keyword" },
        },
        defaultMetadata: {},
        measures: [
          { type: "battery", name: "battery" },
          { type: "temperature", name: "temperature" },
        ],
      },
    });

    await sdk.query<ApiModelWriteDeviceRequest>({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "Zigbee",
        measures: [{ type: "battery", name: "battery" }],
        metadataMappings: {
          network: { type: "keyword" },
        },
      },
    });

    const deviceModelUpdated = await sdk.document.get<DeviceModelContent>(
      "device-manager",
      "models",
      "model-device-Zigbee",
    );
    expect(deviceModelUpdated._source).toMatchObject<DeviceModelContent>({
      type: "device",
      device: {
        model: "Zigbee",
        metadataMappings: {
          network: { type: "keyword" },
        },
        defaultMetadata: {},
        measures: [{ type: "battery", name: "battery" }],
      },
    });
  });

  it("Should allow deleting values mappings from a Measure model", async () => {
    await sdk.query<ApiModelWriteMeasureRequest>({
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

    const measurePresenceBase = await sdk.document.get<MeasureModelContent>(
      "device-manager",
      "models",
      "model-measure-presence",
    );

    expect(measurePresenceBase._source).toMatchObject<MeasureModelContent>({
      type: "measure",
      measure: {
        type: "presence",
        valuesMappings: {
          presence: { type: "boolean" },
          presence2: { type: "boolean" },
        },
      },
    });

    await sdk.query<ApiModelWriteMeasureRequest>({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "presence",
        valuesMappings: {
          presence: { type: "boolean" },
        },
      },
    });

    const measurePresenceUpdate = await sdk.document.get<MeasureModelContent>(
      "device-manager",
      "models",
      "model-measure-presence",
    );

    expect(measurePresenceUpdate).toMatchObject<
      Partial<KDocument<MeasureModelContent>>
    >({
      _source: {
        type: "measure",
        measure: {
          type: "presence",
          valuesMappings: {
            presence: { type: "boolean" },
          },
        },
      },
    });
  });

  it("Should not allow to use incorrect measure type in models", async () => {
    const writeAssetQuery: ApiModelWriteAssetRequest = {
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        model: "TestHouse",
        measures: [
          {
            name: "Test",
            type: "Test",
          },
        ],
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

  it("can accept valuesDetails when writing a measure", async () => {
    await sdk.query<ApiModelWriteMeasureRequest>({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "light",
        valuesMappings: {
          light: { type: "float" },
        },
        valuesDetails: {
          light: {
            en: {
              friendlyName: "Light intensity",
              unit: "lux",
            },
            fr: {
              friendlyName: "Intensité lumineuse",
              unit: "lux",
            },
          },
        },
      },
    });

    const deviceModel = await sdk.document.get<MeasureModelContent>(
      "device-manager",
      "models",
      "model-measure-light",
    );
    expect(deviceModel).toMatchObject<Partial<KDocument<MeasureModelContent>>>({
      _source: {
        type: "measure",
        measure: {
          type: "light",
          valuesMappings: {
            light: { type: "float" },
          },
          valuesDetails: {
            light: {
              en: {
                friendlyName: "Light intensity",
                unit: "lux",
              },
              fr: {
                friendlyName: "Intensité lumineuse",
                unit: "lux",
              },
            },
          },
        },
      },
    });
  });
});
