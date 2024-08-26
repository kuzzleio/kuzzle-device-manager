import { sendDummyTempPositionPayloads, setupHooks } from "../../../helpers";

import {
  ApiAssetGetLastMeasuredAtRequest,
  ApiAssetGetLastMeasuredAtResult,
} from "../../../../lib/modules/asset";

jest.setTimeout(10000);

describe("AssetsController:getLastMeasuredAt", () => {
  const sdk = setupHooks();

  it("should return the last measure date of the asset", async () => {
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
      ApiAssetGetLastMeasuredAtRequest,
      ApiAssetGetLastMeasuredAtResult
    >({
      _id: "Container-linked2",
      controller: "device-manager/assets",
      action: "getLastMeasuredAt",
      engineId: "engine-ayse",
    });

    expect(result).toMatchObject({
      lastMeasuredAt: lastMeasureDate,
    });
  });

  it("should return a not found error if there are no measures", async () => {
    const noMeasures: ApiAssetGetLastMeasuredAtRequest = {
      _id: "Imaginary",
      controller: "device-manager/assets",
      action: "getLastMeasuredAt",
      engineId: "engine-ayse",
    };
    await expect(sdk.query(noMeasures)).rejects.toThrow(
      /^No measure could be found for this digital twin$/,
    );
  });
});
