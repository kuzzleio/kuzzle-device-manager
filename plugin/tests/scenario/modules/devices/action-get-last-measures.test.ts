import { sendDummyTempPositionPayloads, setupHooks } from "../../../helpers";

import {
  ApiDeviceGetLastMeasuresRequest,
  ApiDeviceGetLastMeasuresResult,
} from "../../../../lib/modules/device";

jest.setTimeout(10000);

describe("DevicesController:getLastMeasures", () => {
  const sdk = setupHooks();

  it("should return the last measures of the device", async () => {
    const lastMeasureDate = Date.now();

    await sendDummyTempPositionPayloads(sdk, [
      {
        deviceEUI: "unlinked3",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2000 },
        battery: 0.8,
        measuredAt: lastMeasureDate - 2000,
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
        location: { lat: 42.2, lon: 2.42, accuracy: 2200 },
        battery: 0.8,
        measuredAt: lastMeasureDate - 1000,
      },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const { result } = await sdk.query<
      ApiDeviceGetLastMeasuresRequest,
      ApiDeviceGetLastMeasuresResult
    >({
      _id: "DummyTempPosition-unlinked3",
      controller: "device-manager/devices",
      action: "getLastMeasures",
      engineId: "engine-ayse",
    });

    expect(result).toMatchObject({
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
    });
  });

  it("should return a not found error if there are no measures", async () => {
    const noMeasures: ApiDeviceGetLastMeasuresRequest = {
      _id: "Imaginary",
      controller: "device-manager/devices",
      action: "getLastMeasures",
      engineId: "engine-ayse",
    };
    await expect(sdk.query(noMeasures)).rejects.toThrow(
      /^No measure could be found for this digital twin$/,
    );
  });
});
