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
    { name: "theTemperature", type: "temperature" },
    { name: "theBattery", type: "battery" },
    { name: "thePosition", type: "position" },
  ] as const;

  constructor() {
    super();
  }

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
      "theTemperature",
      {
        measuredAt: Date.now(),
        type: "temperature",
        values: { temperature: payload.register55 },
      }
    );

    decodedPayload.addMeasurement<PositionMeasurement>(
      payload.deviceEUI,
      "thePosition",
      {
        measuredAt: Date.now(),
        type: "position",
        values: {
          position: {
            lat: payload.location.lat,
            lon: payload.location.lon,
          },
          accuracy: payload.location.accu,
        },
      }
    );

    decodedPayload.addMeasurement<BatteryMeasurement>(
      payload.deviceEUI,
      "theBattery",
      {
        measuredAt: Date.now(),
        type: "battery",
        values: {
          battery: payload.batteryLevel * 100,
        },
      }
    );

    return decodedPayload;
  }
}
