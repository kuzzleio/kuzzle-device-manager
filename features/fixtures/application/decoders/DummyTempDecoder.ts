import { JSONObject, KuzzleRequest, PreconditionError } from 'kuzzle';

import {
  Decoder,
  DecodedPayload,
  TemperatureMeasurement,
  BatteryMeasurement,
  MeasuresRegister,
} from '../../../../index';

export class DummyTempDecoder extends Decoder {
  constructor (measuresRegister: MeasuresRegister) {
    super('DummyTemp', {
      'theTemperature': 'temperature',
      'theBatteryLevel': 'battery',
    },
    measuresRegister);

    this.payloadsMappings = {
      deviceEUI: { type: 'keyword' }
    };
  }

  async validate (payload: JSONObject, request: KuzzleRequest) {
    if (! payload.deviceEUI) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI"');
    }

    if (payload.invalid) {
      return false;
    }

    return true;
  }

  async decode (payload: JSONObject, request: KuzzleRequest): Promise<DecodedPayload> {
    const temperature: TemperatureMeasurement = {
      deviceMeasureName: 'theTemperature',
      measuredAt: Date.now(),
      type: 'temperature',
      values: {
        temperature: payload.register55,
      },
    };

    const battery: BatteryMeasurement = {
      deviceMeasureName: 'theBatteryLevel',
      measuredAt: Date.now(),
      type: 'battery',
      values: {
        battery: payload.batteryLevel * 100,
      },
    };

    return new Map([[payload.deviceEUI, [temperature, battery]]]);
  }
}
