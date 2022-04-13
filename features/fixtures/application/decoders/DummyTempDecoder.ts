import { JSONObject, KuzzleRequest, PreconditionError } from 'kuzzle';

import {
  Decoder,
  DecodedPayload,
  TemperatureMeasurement,
  BatteryMeasurement,
} from '../../../../index';

export class DummyTempDecoder extends Decoder {
  constructor () {
    super('DummyTemp', ['temperature']);

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
      measuredAt: Date.now(),
      values: {
        temperature: payload.register55,
      }
    };

    const battery: BatteryMeasurement = {
      measuredAt: Date.now(),
      values: {
        battery: payload.batteryLevel * 100,
      }
    };

    const decodedPayload: DecodedPayload = {
      reference: payload.deviceEUI,
      measures: {
        temperature,
        battery,
      },
    };

    return decodedPayload;
  }
}
