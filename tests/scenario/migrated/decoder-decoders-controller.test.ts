import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";

jest.setTimeout(10000);

describe("features/Decoder/DecodersController", () => {
  const sdk = useSdk();

  beforeAll(async () => {
    await sdk.connect();
    await beforeAllCreateEngines(sdk);
  });

  beforeEach(async () => {
    await beforeEachTruncateCollections(sdk);
    await beforeEachLoadFixtures(sdk);
  });

  afterAll(async () => {
    sdk.disconnect();
  });

  it("Prune payloads collection", async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: "document",
      action: "update",
      index: "device-manager",
      collection: "config",
      _id: "plugin--device-manager",
      body: { "device-manager": { provisioningStrategy: "auto" } },
    });

    response = await sdk.query({
      controller: "collection",
      action: "truncate",
      index: "device-manager",
      collection: "payloads",
    });

    response = await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "12345", temperature: 23.1, metadata: { color: "RED" } },
    ]);

    response = await sendPayloads(sdk, "dummy-temp-position", [
      {
        deviceEUI: "12345",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
      },
    ]);

    response = await sdk.query({
      controller: "collection",
      action: "refresh",
      index: "device-manager",
      collection: "payloads",
    });

    response = await sdk.query({
      controller: "document",
      action: "search",
      index: "device-manager",
      collection: "payloads",
    });

    expect(response.result).toMatchObject({ total: 2 });

    response = await sdk.query({
      controller: "device-manager/decoders",
      action: "prunePayloads",
      body: { days: 0, deviceModel: "DummyTemp" },
    });

    response = await sdk.query({
      controller: "collection",
      action: "refresh",
      index: "device-manager",
      collection: "payloads",
    });

    response = await sdk.query({
      controller: "document",
      action: "search",
      index: "device-manager",
      collection: "payloads",
    });

    expect(response.result).toMatchObject({ total: 1 });
  });

  it("provide associated payload action when listing decoder capabilities", async () => {
    let response;
    let promise;
    response = await sdk.query({
      controller: "device-manager/decoders",
      action: "list",
    });

    expect(response.result.decoders).toMatchObject([
      {
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
      },
      {
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
      },
    ]);
  });
});
