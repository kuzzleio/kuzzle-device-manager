import {
  beforeAllCreateEngines,
  beforeEachLoadFixtures,
  beforeEachTruncateCollections,
} from "../../../hooks";
import { ApiDecoderListRequest, ApiDecoderListResult } from "../../../../index";

import { useSdk, sendPayloads } from "../../../helpers";
import { deviceEmptyTempId } from "../../../fixtures/devices";

jest.setTimeout(10000);

describe("DecodersController", () => {
  const sdk = useSdk();

  beforeAll(async () => {
    await sdk.connect();
    await beforeAllCreateEngines(sdk);

    // ? Force provisioning strategy to "auto"
    await sdk.query({
      controller: "document",
      action: "update",
      index: "device-manager",
      collection: "config",
      _id: "plugin--device-manager",
      body: { "device-manager": { provisioningStrategy: "auto" } },
    });
  });

  beforeEach(async () => {
    await beforeEachTruncateCollections(sdk);
    await beforeEachLoadFixtures(sdk);
  });

  afterAll(async () => {
    sdk.disconnect();
  });

  it("Prune payloads collection", async () => {
    await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "12345", temperature: 23.1, metadata: { color: "RED" } },
    ]);

    await sendPayloads(sdk, "dummy-temp-position", [
      {
        deviceEUI: "12345",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
      },
    ]);

    await sdk.collection.refresh("device-manager", "payloads");

    const countBeforePrune = await sdk.query({
      controller: "document",
      action: "search",
      index: "device-manager",
      collection: "payloads",
    });

    expect(countBeforePrune.result).toMatchObject({ total: 2 });

    await sdk.query({
      controller: "device-manager/decoders",
      action: "prunePayloads",
      body: { days: 0, deviceModel: "DummyTemp" },
    });

    await sdk.collection.refresh("device-manager", "payloads");

    const countAfterPrune = await sdk.query({
      controller: "document",
      action: "search",
      index: "device-manager",
      collection: "payloads",
    });

    expect(countAfterPrune.result).toMatchObject({ total: 1 });
  });

  it("provide associated payload action when listing decoder capabilities", async () => {
    const { result } = await sdk.query<
      ApiDecoderListRequest,
      ApiDecoderListResult
    >({
      controller: "device-manager/decoders",
      action: "list",
    });

    expect(result.decoders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "dummy-temp-position",
          deviceModel: "DummyTempPosition",
          measures: [
            {
              name: "temperature",
              type: "temperature",
            },
            {
              name: "battery",
              type: "battery",
            },
            {
              name: "position",
              type: "position",
            },
          ],
        }),
        expect.objectContaining({
          action: "dummy-temp",
          deviceModel: "DummyTemp",
          measures: [
            {
              name: "temperature",
              type: "temperature",
            },
            {
              name: "accelerationSensor",
              type: "acceleration",
            },
            {
              name: "battery",
              type: "battery",
            },
          ],
        }),
      ]),
    );
  });

  it("should not throw an error when decoding a payload without measures", async () => {
    await sendPayloads(sdk, "empty-temp", [
      { deviceEUI: "empty", metadata: { color: "RED" } },
    ]);

    await sdk.collection.refresh("device-manager", "payloads");

    const device = await sdk.query({
      controller: "document",
      action: "get",
      collection: "devices",
      engineId: "engine-ayse",
      _id: deviceEmptyTempId,
    });

    expect(device.result._source.metadata.color).toBe("RED");
  });
});
