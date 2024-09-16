import {
  sendDummyTempPayloads,
  sendDummyTempPositionPayloads,
  setupHooks,
} from "../../../helpers";

import {
  ApiDeviceMGetLastMeasuresRequest,
  ApiDeviceMGetLastMeasuresResult,
} from "../../../../lib/modules/device";

jest.setTimeout(10000);

describe("DevicesController:mGetLastMeasures", () => {
  const sdk = setupHooks();

  it("should return the last measures of the devices", async () => {
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
      ApiDeviceMGetLastMeasuresRequest,
      ApiDeviceMGetLastMeasuresResult
    >({
      controller: "device-manager/devices",
      action: "mGetLastMeasures",
      engineId: "engine-ayse",
      body: {
        ids: ["DummyTempPosition-warehouse", "DummyTempPosition-unlinked3"],
      },
    });

    expect(result).toMatchObject({
      "DummyTempPosition-warehouse": {
        battery: {
          measuredAt: lastMeasureDate,
          type: "battery",
          values: {
            battery: 70,
          },
        },
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
        temperature: {
          measuredAt: lastMeasureDate,
          type: "temperature",
          values: {
            temperature: 24.1,
          },
        },
      },
      "DummyTempPosition-unlinked3": {
        battery: {
          measuredAt: lastMeasureDate,
          type: "battery",
          values: {
            battery: 70,
          },
        },
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
        temperature: {
          measuredAt: lastMeasureDate,
          type: "temperature",
          values: {
            temperature: 24.1,
          },
        },
      },
    });
  });

  it("should only return the measures of the requested devices", async () => {
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
      ApiDeviceMGetLastMeasuresRequest,
      ApiDeviceMGetLastMeasuresResult
    >({
      controller: "device-manager/devices",
      action: "mGetLastMeasures",
      engineId: "engine-ayse",
      body: {
        ids: ["DummyTemp-unlinked1"],
      },
    });

    expect(Object.keys(result)).toEqual(["DummyTemp-unlinked1"]);
  });
});
