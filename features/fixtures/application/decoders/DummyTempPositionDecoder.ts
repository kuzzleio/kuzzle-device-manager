import { Decoder, DeviceContent } from '../../../../index';
import { JSONObject, KuzzleRequest, PreconditionError } from 'kuzzle';

export class DummyTempPositionDecoder extends Decoder {
  constructor () {
    super('DummyTempPosition');
  }

  async validate (payload: JSONObject, request: KuzzleRequest) {
    if (payload.deviceEUI === undefined) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI"');
    }

    return true;
  }

  async decode (payload: JSONObject, request: KuzzleRequest): Promise<DeviceContent> {
    const deviceContent: DeviceContent = {
      reference: payload.deviceEUI,
      measures: {
        temperature: {
          updatedAt: Date.now(),
          degree: payload.register55,
        },
        position: {
          updatedAt: Date.now(),
          point: {
            lat: payload.location.lat,
            lon: payload.location.lon,
          },
          accuracy: payload.location.accu,
        }
      },
      qos: {
        battery: payload.batteryLevel * 100
      }
    };

    return deviceContent;
  }
}
