import { JSONObject, Kuzzle } from "kuzzle-sdk";

export type DummyTempPayload = {
  deviceEUI: string;
  temperature: number;
  measuredAt?: number;
  battery?: number;
  metadata?: JSONObject;
};

export type DummyTempPositionPayload = DummyTempPayload & {
  location: {
    lat: number;
    lon: number;
    accuracy?: number;
  };
};

export async function sendDummyTempPayloads(
  sdk: Kuzzle,
  payloads: DummyTempPayload[]
) {
  for (const payload of payloads) {
    await sdk.query({
      controller: "device-manager/payloads",
      action: "dummy-temp",
      body: payload,
    });
  }
}

export async function sendDummyTempPositionPayloads(
  sdk: Kuzzle,
  payloads: DummyTempPositionPayload[]
) {
  for (const payload of payloads) {
    await sdk.query({
      controller: "device-manager/payloads",
      action: "dummy-temp-position",
      body: payload,
    });
  }
}
