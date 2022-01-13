import { JSONObject, KuzzleRequest, PreconditionError } from 'kuzzle';

import { Decoder, PositionMeasure, TemperatureMeasure , DecodedPayload } from '../../../../index';

export class DummyTempPositionDecoder extends Decoder {
  constructor () {
    super('DummyTempPosition', ["temperature", "position"]);
  }

  async validate (payload: JSONObject, request: KuzzleRequest) {
    if (payload.deviceEUI === undefined) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI"');
    }

    return true;
  }

  async decode (payload: JSONObject, request: KuzzleRequest): Promise<DecodedPayload> {
    const temperature: TemperatureMeasure = {
      measuredAt: Date.now(),
      values: {
        temperature: payload.register55,
      }
    };

    const position: PositionMeasure = {
      measuredAt: Date.now(),
      values: {
        position: {
          lat: payload.location.lat,
          lon: payload.location.lon,
        },
        accuracy: payload.location.accu,
      }
    };

    const decodedPayload: DecodedPayload = {
      reference: payload.deviceEUI,
      measures: {
        temperature,
        position,
      },
    };

    return decodedPayload;
  }
}
