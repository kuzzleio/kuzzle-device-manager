import { KDocument } from "kuzzle";
import {
  ApiModelWriteAssetRequest,
  ApiModelWriteDeviceRequest,
  ApiModelWriteMeasureRequest,
  AssetModelContent,
  DeviceModelContent,
  MeasureModelContent,
} from "../../../../lib/modules/model";
import { setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("features/Model/Controller", () => {
  const sdk = setupHooks();

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

    await expect(
      sdk.document.get<AssetModelContent>(
        "device-manager",
        "models",
        "model-asset-Plane"
      )
    ).resolves.toMatchObject<Partial<KDocument<AssetModelContent>>>({
      _source: {
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

    await expect(
      sdk.document.get<AssetModelContent>(
        "device-manager",
        "models",
        "model-asset-Plane"
      )
    ).resolves.toMatchObject<Partial<KDocument<AssetModelContent>>>({
      _source: {
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

    await expect(
      sdk.document.get<DeviceModelContent>(
        "device-manager",
        "models",
        "model-device-Zigbee"
      )
    ).resolves.toMatchObject<Partial<KDocument<DeviceModelContent>>>({
      _source: {
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

    await expect(
      sdk.document.get<DeviceModelContent>(
        "device-manager",
        "models",
        "model-device-Zigbee"
      )
    ).resolves.toMatchObject<Partial<KDocument<DeviceModelContent>>>({
      _source: {
        type: "device",
        device: {
          model: "Zigbee",
          metadataMappings: {
            network: { type: "keyword" },
          },
          defaultMetadata: {},
          measures: [{ type: "battery", name: "battery" }],
        },
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

    await expect(
      sdk.document.get<MeasureModelContent>(
        "device-manager",
        "models",
        "model-measure-presence"
      )
    ).resolves.toMatchObject<Partial<KDocument<MeasureModelContent>>>({
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

    await expect(
      sdk.document.get<MeasureModelContent>(
        "device-manager",
        "models",
        "model-measure-presence"
      )
    ).resolves.toMatchObject<Partial<KDocument<MeasureModelContent>>>({
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
});
