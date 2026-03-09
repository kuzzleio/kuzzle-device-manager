import { JSONObject, Kuzzle } from "kuzzle-sdk";

type MeasureDated<T> = { value: T; measuredAt: number };
export type MeasureValue<T> = T | MeasureDated<T>;

export function isMeasureDated<T>(
  measure: MeasureValue<T>,
): measure is MeasureDated<T> {
  if (measure === undefined || measure === null) {
    return false;
  }

  const test = measure as MeasureDated<T>;
  return test.value !== undefined && test.measuredAt !== undefined;
}

export interface Location {
  lat: number;
  lon: number;
  accuracy?: number;
}

export interface Acceleration {
  x: number;
  y: number;
  z: number;
  accuracy: number;
}

export type DummyTempSimplePayload = {
  deviceEUI: string;
  temperature: MeasureValue<number>;
  measuredAt?: number;
  battery?: MeasureValue<number>;
  acceleration?: MeasureValue<Acceleration>;
  metadata?: JSONObject;
};

export type DummyTempPayload =
  | DummyTempSimplePayload
  | {
      measurements: DummyTempSimplePayload[];
    };

export type DummyTempPositionPayload = DummyTempPayload & {
  location: MeasureValue<Location>;
};

export async function sendDummyTempPayloads(
  sdk: Kuzzle,
  payloads: DummyTempPayload[],
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
  payloads: DummyTempPositionPayload[],
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
  payloads: JSONObject[],
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
