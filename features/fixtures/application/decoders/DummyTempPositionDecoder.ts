import { JSONObject, PreconditionError } from "kuzzle";

import {
  Decoder,
  BatteryMeasurement,
  PositionMeasurement,
  TemperatureMeasurement,
  DecodedPayload,
} from "../../../../index";

export class DummyTempPositionDecoder extends Decoder {
  public measures = [
    { name: "temperature", type: "temperature" },
    { name: "battery", type: "battery" },
    { name: "position", type: "position" },
  ] as const;

  async validate(payload: JSONObject) {
    if (payload.deviceEUI === undefined) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI"');
    }

    return true;
  }

  async decode(payload: JSONObject): Promise<DecodedPayload<Decoder>> {
    const decodedPayload = new DecodedPayload<DummyTempPositionDecoder>(this);

    decodedPayload.addMeasurement<TemperatureMeasurement>(
      payload.deviceEUI,
      "temperature",
      {
        measuredAt: Date.now(),
        type: "temperature",
        values: { temperature: payload.temperature },
      }
    );

    decodedPayload.addMeasurement<PositionMeasurement>(
      payload.deviceEUI,
      "position",
      {
        measuredAt: Date.now(),
        type: "position",
        values: {
          position: {
            lat: payload.location.lat,
            lon: payload.location.lon,
          },
          accuracy: payload.location.accuracy,
        },
      }
    );

    decodedPayload.addMeasurement<BatteryMeasurement>(
      payload.deviceEUI,
      "battery",
      {
        measuredAt: Date.now(),
        type: "battery",
        values: {
          battery: payload.battery * 100,
        },
      }
    );

    return decodedPayload;
  }
}
