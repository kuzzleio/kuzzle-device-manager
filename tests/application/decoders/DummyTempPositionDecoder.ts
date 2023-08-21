import { PreconditionError } from "kuzzle";
import { JSONObject } from "kuzzle-sdk";

import {
  Decoder,
  BatteryMeasurement,
  PositionMeasurement,
  TemperatureMeasurement,
  DecodedPayload,
} from "../../../index";
import { isMeasureDated } from "../../helpers/payloads";

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

  async decode(
    decodedPayload: DecodedPayload<DummyTempPositionDecoder>,
    payload: JSONObject
  ): Promise<DecodedPayload<DummyTempPositionDecoder>> {
    decodedPayload.addMeasurement<TemperatureMeasurement>(
      payload.deviceEUI,
      "temperature",
      {
        measuredAt: isMeasureDated(payload.temperature)
          ? payload.temperature.measuredAt
          : payload.measuredAt ?? Date.now(),
        type: "temperature",
        values: {
          temperature: isMeasureDated(payload.temperature)
            ? payload.temperature.value
            : payload.temperature,
        },
      }
    );

    const location = isMeasureDated(payload.location)
      ? payload.location.value
      : payload.location;
    decodedPayload.addMeasurement<PositionMeasurement>(
      payload.deviceEUI,
      "position",
      {
        measuredAt: isMeasureDated(payload.location)
          ? payload.location.measuredAt
          : payload.measuredAt ?? Date.now(),
        type: "position",
        values: {
          position: {
            lat: location.lat,
            lon: location.lon,
          },
          accuracy: location.accuracy,
        },
      }
    );

    const battery = isMeasureDated(payload.battery)
      ? payload.battery.value
      : payload.battery;
    decodedPayload.addMeasurement<BatteryMeasurement>(
      payload.deviceEUI,
      "battery",
      {
        measuredAt: isMeasureDated(payload.battery)
          ? payload.battery.measuredAt
          : payload.measuredAt ?? Date.now(),
        type: "battery",
        values: {
          battery: battery * 100,
        },
      }
    );

    return decodedPayload;
  }
}
