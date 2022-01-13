import { JSONObject, KuzzleRequest, PreconditionError } from 'kuzzle';

import { Decoder, DecodedPayload, TemperatureMeasure } from '../../../../index';

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
    const temperature: TemperatureMeasure = {
      measuredAt: Date.now(),
      values: {
        temperature: payload.register55,
      }
    };

    const decodedPayload: DecodedPayload = {
      reference: payload.deviceEUI,
      measures: {
        temperature,
      },
    };

    return decodedPayload;
  }
}
