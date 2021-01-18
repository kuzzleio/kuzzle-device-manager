import _ from 'lodash';

import { Decoder, SensorContent, Sensor } from '../../../index';
import { JSONObject, KuzzleRequest, PreconditionError } from 'kuzzle';

export class DummyTempDecoder extends Decoder {
  constructor () {
    super('DummyTemp');
  }

  async validate (payload: JSONObject, request: KuzzleRequest) {
    if (_.isEmpty(payload.deviceEUI)) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI"');
    }

    return true;
  }

  async decode (payload: JSONObject, request: KuzzleRequest): Promise<SensorContent> {
    const sensorContent: SensorContent = {
      reference: payload.deviceEUI,
      measures: {
        temperature: {
          updatedAt: Date.now(),
          value: payload.register55,
        }
      },
      qos: {
        battery: payload.batteryLevel * 100
      }
    };

    return sensorContent;
  }

  async beforeRegister (sensor: Sensor, request: KuzzleRequest) {
    sensor._source.qos.registerEnriched = true;

    return sensor;
  }

  async beforeUpdate (sensor: Sensor, request: KuzzleRequest) {
    sensor._source.qos.updateEnriched = true;

    return sensor;
  }

  async afterRegister (sensor: Sensor, request: KuzzleRequest) {
    return { afterRegister: true };
  }

  async afterUpdate (sensor: Sensor, request: KuzzleRequest) {
    return { afterUpdate: true };
  }
}
