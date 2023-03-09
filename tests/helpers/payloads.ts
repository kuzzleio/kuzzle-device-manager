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

// Delay in second for dates sent between two steps so the plugin accept the new
// Add a delay for subsequent payload of the same device so the plugin accept it
const deviceDelay = {};

export async function sendPayloads(
  sdk: Kuzzle,
  action: string,
  payloads: JSONObject[]
) {
  let response;

  for (let i = 0; i < payloads.length; i++) {
    const payload = payloads[i];

    if (deviceDelay[payload.reference]) {
      deviceDelay[payload.reference] += 2;
    } else {
      deviceDelay[payload.reference] = 1;
    }

    if (!payload.date) {
      const delay = deviceDelay[payload.reference] * 1000;
      payload.date = new Date(Date.now() + delay);
    }

    response = await sdk.query({
      controller: "device-manager/payloads",
      action,
      body: payload,
    });
  }

  return response;
}
