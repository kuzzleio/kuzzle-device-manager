import {
  ApiAssetCreateRequest,
  ApiAssetCreateResult,
} from "../../../../lib/modules/asset";
import {
  ApiModelUpdateAssetRequest,
  ApiModelUpdateAssetResult,
  ApiModelWriteAssetRequest,
  ApiModelWriteAssetResult,
} from "../../../../lib/modules/model";
import { setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("Asset model measure slots propagation", () => {
  const sdk = setupHooks();

  it("should update the embedded measure slots of existing assets with writeAsset", async () => {
    await sdk.query<ApiModelWriteAssetRequest, ApiModelWriteAssetResult>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Plane",
        metadataMappings: { size: { type: "integer" } },
        measures: [{ name: "temperatureExt", type: "temperature" }],
      },
    });

    const { result } = await sdk.query<
      ApiAssetCreateRequest,
      ApiAssetCreateResult
    >({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-kuzzle",
      body: {
        model: "Plane",
        reference: "Technoplane",
        metadata: { size: 8311 },
      },
    });

    expect(result).toMatchObject({
      _source: {
        measureSlots: [
          {
            name: "temperatureExt",
            type: "temperature",
          },
        ],
      },
    });

    await sdk.query<ApiModelWriteAssetRequest, ApiModelWriteAssetResult>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Plane",
        metadataMappings: { size: { type: "integer" } },
        measures: [
          {
            name: "temperatureExt",
            type: "temperature",
          },
          {
            name: "temperatureInt",
            type: "temperature",
          },
        ],
      },
    });

    await expect(
      sdk.document.get("engine-kuzzle", "assets", "Plane-Technoplane"),
    ).resolves.toMatchObject({
      _source: {
        measureSlots: [
          {
            name: "temperatureExt",
            type: "temperature",
          },
          {
            name: "temperatureInt",
            type: "temperature",
          },
        ],
      },
    });
  });

  it("should update the embedded measure slots of existing assets with updateAsset", async () => {
    await sdk.query<ApiModelWriteAssetRequest, ApiModelWriteAssetResult>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Plane",
        metadataMappings: { size: { type: "integer" } },
        measures: [{ name: "temperatureExt", type: "temperature" }],
      },
    });

    const { result } = await sdk.query<
      ApiAssetCreateRequest,
      ApiAssetCreateResult
    >({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-kuzzle",
      body: {
        model: "Plane",
        reference: "Technoplane",
        metadata: { size: 8311 },
      },
    });

    expect(result).toMatchObject({
      _source: {
        measureSlots: [
          {
            name: "temperatureExt",
            type: "temperature",
          },
        ],
      },
    });

    await sdk.query<ApiModelUpdateAssetRequest, ApiModelUpdateAssetResult>({
      controller: "device-manager/models",
      action: "updateAsset",
      engineGroup: "commons",
      model: "Plane",
      body: {
        measures: [
          {
            name: "temperatureExt",
            type: "temperature",
          },
          {
            name: "temperatureInt",
            type: "temperature",
          },
        ],
      },
    });

    await expect(
      sdk.document.get("engine-kuzzle", "assets", "Plane-Technoplane"),
    ).resolves.toMatchObject({
      _source: {
        measureSlots: [
          {
            name: "temperatureExt",
            type: "temperature",
          },
          {
            name: "temperatureInt",
            type: "temperature",
          },
        ],
      },
    });
  });
});
