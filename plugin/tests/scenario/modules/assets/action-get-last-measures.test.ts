import { sendDummyTempPositionPayloads, setupHooks } from "../../../helpers";

import {
  ApiAssetGetLastMeasuresRequest,
  ApiAssetGetLastMeasuresResult,
} from "../../../../lib/modules/asset";

jest.setTimeout(10000);

describe("AssetsController:getLastMeasures", () => {
  const sdk = setupHooks();

  it("should return the last measures of the asset", async () => {
    const lastMeasureDate = Date.now();

    await sendDummyTempPositionPayloads(sdk, [
      {
        deviceEUI: "linked2",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2000 },
        battery: 0.8,
        measuredAt: lastMeasureDate - 2000,
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
        location: { lat: 42.2, lon: 2.42, accuracy: 2200 },
        battery: 0.8,
        measuredAt: lastMeasureDate - 1000,
      },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const { result } = await sdk.query<
      ApiAssetGetLastMeasuresRequest,
      ApiAssetGetLastMeasuresResult
    >({
      _id: "Container-linked2",
      controller: "device-manager/assets",
      action: "getLastMeasures",
      engineId: "engine-ayse",
    });

    expect(result).toMatchObject({
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
    });
  });

  it("should return a not found error if there are no measures", async () => {
    const noMeasures: ApiAssetGetLastMeasuresRequest = {
      _id: "Imaginary",
      controller: "device-manager/assets",
      action: "getLastMeasures",
      engineId: "engine-ayse",
    };
    await expect(sdk.query(noMeasures)).rejects.toThrow(
      /^No measure could be found for this digital twin$/,
    );
  });
});
