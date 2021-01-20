import _ from 'lodash';

import { Decoder, SensorContent } from '../../../index';
import { JSONObject, KuzzleRequest, PreconditionError } from 'kuzzle';

export class DummyTempPositionDecoder extends Decoder {
  constructor () {
    super('DummyTempPosition');
  }

  async validate (payload: JSONObject, request: KuzzleRequest) {
    if (_.isEmpty(payload.deviceEUI)) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI"');
    }
  }

  async decode (payload: JSONObject, request: KuzzleRequest): Promise<SensorContent> {
    const sensorContent: SensorContent = {
      reference: payload.deviceEUI,
      measures: {
        temperature: {
          updatedAt: Date.now(),
          value: payload.register55,
        },
        position: {
          updatedAt: Date.now(),
          latitude: payload.location.lat,
          longitude: payload.location.lon,
          accuracy: payload.location.accu,
        }
      },
      qos: {
        battery: payload.batteryLevel * 100
      }
    };

    return sensorContent;
  }
}
