import {
  sendDummyTempPayloads,
  sendDummyTempPositionPayloads,
  setupHooks,
} from "../../../helpers";

import {
  ApiAssetMGetLastMeasuredAtRequest,
  ApiAssetMGetLastMeasuredAtResult,
} from "../../../../lib/modules/asset";

jest.setTimeout(10000);

describe("AssetsController:mGetLastMeasuredAt", () => {
  const sdk = setupHooks();

  it("should return the date of the last measure of the assets", async () => {
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
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
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
      ApiAssetMGetLastMeasuredAtRequest,
      ApiAssetMGetLastMeasuredAtResult
    >({
      controller: "device-manager/assets",
      action: "mGetLastMeasuredAt",
      engineId: "engine-ayse",
      body: {
        ids: ["Warehouse-linked", "Container-linked2"],
      },
    });

    expect(result).toMatchObject({
      "Warehouse-linked": lastMeasureDate,
      "Container-linked2": lastMeasureDate,
    });
  });

  it("should only return the last measure date of the requested assets", async () => {
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
      ApiAssetMGetLastMeasuredAtRequest,
      ApiAssetMGetLastMeasuredAtResult
    >({
      controller: "device-manager/assets",
      action: "mGetLastMeasuredAt",
      engineId: "engine-ayse",
      body: {
        ids: ["Container-linked1"],
      },
    });

    expect(Object.keys(result)).toEqual(["Container-linked1"]);
  });
});
