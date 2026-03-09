import {
  sendDummyTempPayloads,
  sendDummyTempPositionPayloads,
  setupHooks,
} from "../../../helpers";

import {
  ApiAssetMGetLastMeasuresRequest,
  ApiAssetMGetLastMeasuresResult,
} from "../../../../lib/modules/asset";

jest.setTimeout(10000);

describe("AssetsController:mGetLastMeasures", () => {
  const sdk = setupHooks();

  it("should return the last measures of the assets", async () => {
    const lastMeasureDate = Date.now();

    await sendDummyTempPositionPayloads(sdk, [
      {
        deviceEUI: "warehouse",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
        measuredAt: lastMeasureDate - 2000,
      },
      {
        deviceEUI: "warehouse",
        temperature: 24.1,
        location: { lat: 42.2, lon: 2.42, accuracy: 2000 },
        battery: 0.7,
        measuredAt: lastMeasureDate,
      },
      {
        deviceEUI: "warehouse",
        temperature: 23.6,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
        measuredAt: lastMeasureDate - 1000,
      },
      {
        deviceEUI: "linked2",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
        measuredAt: lastMeasureDate - 1500,
      },
      {
        deviceEUI: "linked2",
        temperature: 24.1,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.7,
        measuredAt: lastMeasureDate,
      },
      {
        deviceEUI: "linked2",
        temperature: 23.6,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
        measuredAt: lastMeasureDate - 3000,
      },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const { result } = await sdk.query<
      ApiAssetMGetLastMeasuresRequest,
      ApiAssetMGetLastMeasuresResult
    >({
      controller: "device-manager/assets",
      action: "mGetLastMeasures",
      engineId: "engine-ayse",
      body: {
        ids: ["Warehouse-linked", "Container-linked2"],
      },
    });

    expect(result).toMatchObject({
      "Warehouse-linked": {
        position: {
          measuredAt: lastMeasureDate,
          type: "position",
          values: {
            accuracy: 2000,
            position: {
              lat: 42.2,
              lon: 2.42,
            },
          },
        },
      },
      "Container-linked2": {
        position: {
          measuredAt: lastMeasureDate,
          type: "position",
          values: {
            accuracy: 2100,
            position: {
              lat: 42.2,
              lon: 2.42,
            },
          },
        },
        temperatureExt: {
          measuredAt: lastMeasureDate,
          type: "temperature",
          values: {
            temperature: 24.1,
          },
        },
      },
    });
  });

  it("should only return the measures of the requested assets", async () => {
    const lastMeasureDate = Date.now();

    await sendDummyTempPayloads(sdk, [
      { deviceEUI: "linked1", temperature: 20, measuredAt: lastMeasureDate },
    ]);

    await sendDummyTempPositionPayloads(sdk, [
      {
        deviceEUI: "linked2",
        temperature: 44,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        measuredAt: lastMeasureDate,
      },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const { result } = await sdk.query<
      ApiAssetMGetLastMeasuresRequest,
      ApiAssetMGetLastMeasuresResult
    >({
      controller: "device-manager/assets",
      action: "mGetLastMeasures",
      engineId: "engine-ayse",
      body: {
        ids: ["Container-linked1"],
      },
    });

    expect(Object.keys(result)).toEqual(["Container-linked1"]);
  });
});
