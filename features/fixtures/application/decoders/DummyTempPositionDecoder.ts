import { JSONObject, PreconditionError } from "kuzzle";

import {
  Decoder,
  BatteryMeasureValues,
  PositionMeasureValues,
  TemperatureMeasureValues,
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

    decodedPayload.addMeasurement<TemperatureMeasureValues>(
      payload.deviceEUI,
      "temperature",
      {
        measuredAt: Date.now(),
        type: "temperature",
        values: { temperature: payload.temperature },
      }
    );

    decodedPayload.addMeasurement<PositionMeasureValues>(
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

    decodedPayload.addMeasurement<BatteryMeasureValues>(
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
