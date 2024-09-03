import {
  ApiAssetGetRequest,
  ApiAssetGetResult,
} from "../../../../lib/modules/asset";
import {
  ApiDeviceGetRequest,
  ApiDeviceGetResult,
} from "../../../../lib/modules/device";
import {
  documentGet,
  sendDummyTempPayloads,
  setupHooks,
} from "../../../helpers";

jest.setTimeout(10000);

describe("Ingestion Pipeline: process before", () => {
  const sdk = setupHooks();

  it("allows to add a new measure only to the asset", async () => {
    await sendDummyTempPayloads(sdk, [
      {
        deviceEUI: "linked1",
        temperature: 21,
        metadata: {
          // search this string to find the associated pipe
          color: "test-create-new-asset-measure",
        },
      },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");
    await expect(
      sdk.query({
        _id: "Container-linked1",
        action: "getLastMeasures",
        controller: "device-manager/assets",
        engineId: "engine-ayse",
      }),
    ).resolves.toMatchObject({
      result: {
        temperatureExt: { values: { temperature: 21 } },
        temperatureWeather: { values: { temperature: 21.21 } },
      },
    });
  });

  it("should update the asset document with the new metadata", async () => {
    await sendDummyTempPayloads(sdk, [
      {
        deviceEUI: "linked1",
        temperature: 21,
        metadata: {
          // search this string to find the associated pipe
          color: "test-update-asset-metadata-with-payload",
        },
      },
    ]);
    await sdk.collection.refresh("engine-ayse", "assets");

    const { result } = await sdk.query<ApiAssetGetRequest, ApiAssetGetResult>({
      controller: "device-manager/assets",
      action: "get",
      engineId: "engine-ayse",
      _id: "Container-linked1",
    });

    expect(result._source.metadata.weight).toBe(1337);
  });

  it("should update the admin device document with the new metadata", async () => {
    await sendDummyTempPayloads(sdk, [
      {
        deviceEUI: "unlinked1",
        temperature: 21,
        metadata: {
          // search this string to find the associated pipe
          color: "test-update-device-metadata-with-payload",
          rssi: 80,
        },
      },
    ]);
    await sdk.collection.refresh("device-manager", "devices");

    await expect(
      documentGet(sdk, "device-manager", "devices", "DummyTemp-unlinked1"),
    ).resolves.toMatchObject({
      metadata: {
        rssi: 93,
      },
    });
  });

  it("should update the engine device document with the new metadata", async () => {
    await sendDummyTempPayloads(sdk, [
      {
        deviceEUI: "unlinked1",
        temperature: 21,
        metadata: {
          // search this string to find the associated pipe
          color: "test-update-device-metadata-with-payload",
          rssi: 80,
        },
      },
    ]);
    await sdk.collection.refresh("engine-ayse", "devices");

    const { result } = await sdk.query<ApiDeviceGetRequest, ApiDeviceGetResult>(
      {
        controller: "device-manager/devices",
        action: "get",
        engineId: "engine-ayse",
        _id: "DummyTemp-unlinked1",
      },
    );

    expect(result._source.metadata.rssi).toBe(93);
  });
});
