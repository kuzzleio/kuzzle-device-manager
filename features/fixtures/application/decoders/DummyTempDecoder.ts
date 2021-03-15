import { Decoder, SensorContent, Sensor, BaseAsset } from '../../../../index';
import { JSONObject, KuzzleRequest, PreconditionError } from 'kuzzle';

export class DummyTempDecoder extends Decoder {
  constructor () {
    super('DummyTemp');

    this.payloadsMappings = {
      deviceEUI: { type: 'keyword' }
    };
  }

  async validate (payload: JSONObject, request: KuzzleRequest) {
    if (! payload.deviceEUI) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI"');
    }
  }

  async decode (payload: JSONObject, request: KuzzleRequest): Promise<SensorContent> {
    const sensorContent: SensorContent = {
      reference: payload.deviceEUI,
      measures: {
        temperature: {
          updatedAt: Date.now(),
          degree: payload.register55,
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
    const result = await super.afterRegister(sensor, request);

    return {
      ...result,
      afterRegister: true,
    };
  }

  async afterUpdate (sensor: Sensor, asset: BaseAsset, request: KuzzleRequest) {
    const result = await super.afterUpdate(sensor, asset, request);

    return {
      ...result,
      afterUpdate: true
    };
  }
}
