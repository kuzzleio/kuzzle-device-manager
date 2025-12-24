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
      index: "engine-ayse",
      _id: deviceEmptyTempId,
    });

    expect(device.result._source.metadata.color).toBe("RED");
  });

  it("Reroute a payload to the corresponding handler", async () => {
    await beforeEachLoadFixtures(sdk);
    await sdk.query({
      controller: "device-manager/decoders",
      action: "route",
      body: {
        deviceEUI: "linked2",
        deviceModel: "DummyTempPosition",
        temperature: 45,
        location: { lat: 12, lon: 12, accuracy: 2100 },
        battery: 0.1,
      },
    });

    await expect(
      sdk.document.get(
        "device-manager",
        "devices",
        "DummyTempPosition-linked2",
      ),
    ).resolves.toMatchObject({
      _source: {
        reference: "linked2",
        model: "DummyTempPosition",
        measures: {
          temperature: { type: "temperature", values: { temperature: 45 } },
          position: {
            type: "position",
            values: { position: { lat: 12, lon: 12 }, accuracy: 2100 },
          },
          battery: { type: "battery", values: { battery: 10 } },
        },
        engineId: "engine-ayse",
        assetId: "Container-linked2",
      },
    });
  });

  it("Reroute and reject with error a DummyTemp payload", async () => {
    const promise = sdk.query({
      controller: "device-manager/decoders",
      action: "route",
      body: { deviceEUI: null, deviceModel: "DummyTemp", temperature: 21 },
    });
    await expect(promise).rejects.toMatchObject({
      message: 'Invalid payload: missing "deviceEUI"',
    });
  });
  it("Reroute and reject if deviceModel missing", async () => {
    const noModelPayload = { deviceEUI: "linked1", temperature: 21 };
    const promise = sdk.query({
      controller: "device-manager/decoders",
      action: "route",
      body: noModelPayload,
    });

    await expect(promise).rejects.toMatchObject({
      message: "Payload must specify the deviceModel for proper routing",
    });
    await sdk.collection.refresh("device-manager", "payloads");
    const payloadReceived = await sdk.query({
      controller: "document",
      action: "search",
      index: "device-manager",
      collection: "payloads",
      sort: {
        "_kuzzle_info.createdAt": "DESC",
      },
      size: 1,
    });
    expect(payloadReceived.result.hits[0]._source.payload).toMatchObject(
      noModelPayload,
    );
  });
  it("Reroute and reject if decoder missing", async () => {
    const noDecoderPayload = {
      deviceEUI: "linked1",
      deviceModel: "unknownDecoder",
      temperature: 21,
    };
    const promise = sdk.query({
      controller: "device-manager/decoders",
      action: "route",
      body: noDecoderPayload,
    });

    await expect(promise).rejects.toMatchObject({
      message: "The specified device model is unknown",
    });
    await sdk.collection.refresh("device-manager", "payloads");
    const payloadReceived = await sdk.query({
      controller: "document",
      action: "search",
      index: "device-manager",
      collection: "payloads",
      sort: {
        "_kuzzle_info.createdAt": "DESC",
      },
      size: 1,
    });
    expect(payloadReceived.result.hits[0]._source.deviceModel).toBe(
      noDecoderPayload.deviceModel,
    );
    expect(payloadReceived.result.hits[0]._source.payload).toMatchObject(
      noDecoderPayload,
    );
  });
});
