import {
  sendDummyTempPayloads,
  sendDummyTempPositionPayloads,
  setupHooks,
} from "../../../helpers";

import {
  ApiDeviceMGetLastMeasuredAtRequest,
  ApiDeviceMGetLastMeasuredAtResult,
} from "../../../../lib/modules/device";

jest.setTimeout(10000);

describe("DevicesController:mGetLastMeasuredAt", () => {
  const sdk = setupHooks();

  it("should return the date of the last measure of the devices", async () => {
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
        deviceEUI: "unlinked3",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
        measuredAt: lastMeasureDate - 1500,
      },
      {
        deviceEUI: "unlinked3",
        temperature: 24.1,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.7,
        measuredAt: lastMeasureDate,
      },
      {
        deviceEUI: "unlinked3",
        temperature: 23.6,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
        measuredAt: lastMeasureDate - 3000,
      },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const { result } = await sdk.query<
      ApiDeviceMGetLastMeasuredAtRequest,
      ApiDeviceMGetLastMeasuredAtResult
    >({
      controller: "device-manager/devices",
      action: "mGetLastMeasuredAt",
      engineId: "engine-ayse",
      body: {
        ids: ["DummyTempPosition-warehouse", "DummyTempPosition-unlinked3"],
      },
    });

    expect(result).toMatchObject({
      "DummyTempPosition-warehouse": lastMeasureDate,
      "DummyTempPosition-unlinked3": lastMeasureDate,
    });
  });

  it("should only return the last measure date of the requested devices", async () => {
    const lastMeasureDate = Date.now();

    await sendDummyTempPayloads(sdk, [
      { deviceEUI: "unlinked1", temperature: 20, measuredAt: lastMeasureDate },
    ]);

    await sendDummyTempPositionPayloads(sdk, [
      {
        deviceEUI: "unlinked3",
        temperature: 44,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        measuredAt: lastMeasureDate,
      },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const { result } = await sdk.query<
      ApiDeviceMGetLastMeasuredAtRequest,
      ApiDeviceMGetLastMeasuredAtResult
    >({
      controller: "device-manager/devices",
      action: "mGetLastMeasuredAt",
      engineId: "engine-ayse",
      body: {
        ids: ["DummyTemp-unlinked1"],
      },
    });

    expect(Object.keys(result)).toEqual(["DummyTemp-unlinked1"]);
  });
});
