import { JSONObject, KuzzleRequest, PreconditionError } from "kuzzle";

import {
  Decoder,
  BatteryMeasurement,
  PositionMeasurement,
  TemperatureMeasurement,
  DecodedPayload,
  MeasuresRegister,
} from "../../../../index";

export class DummyTempPositionDecoder extends Decoder {
  constructor(measuresRegister: MeasuresRegister) {
    super(
      "DummyTempPosition",
      {
        theTemperature: "temperature",
        theBattery: "battery",
        thePosition: "position",
      },
      measuresRegister
    );
  }

  async validate(payload: JSONObject, request: KuzzleRequest) {
    if (payload.deviceEUI === undefined) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI"');
    }

    return true;
  }

  async decode(
    payload: JSONObject,
    request: KuzzleRequest
  ): Promise<DecodedPayload> {
    const temperature: TemperatureMeasurement = {
      deviceMeasureName: "theTemperature",
      measuredAt: Date.now(),
      type: "temperature",
      values: { temperature: payload.register55 },
    };

    const position: PositionMeasurement = {
      deviceMeasureName: "thePositition",
      measuredAt: Date.now(),
      type: "position",
      values: {
        position: {
          lat: payload.location.lat,
          lon: payload.location.lon,
        },
        accuracy: payload.location.accu,
      },
    };

    const battery: BatteryMeasurement = {
      deviceMeasureName: "theBattery",
      measuredAt: Date.now(),
      type: "battery",
      values: {
        battery: payload.batteryLevel * 100,
      },
    };

    return { [payload.deviceEUI]: [temperature, position, battery] };
  }
}
