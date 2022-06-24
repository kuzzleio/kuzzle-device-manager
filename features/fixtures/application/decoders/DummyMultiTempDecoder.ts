import { JSONObject, KuzzleRequest, PreconditionError } from 'kuzzle';

import {
  Decoder,
  DecodedPayload,
  TemperatureMeasurement,
  BatteryMeasurement,
} from '../../../../index';

export class DummyMultiTempDecoder extends Decoder {
  constructor () {
    super('DummyMultiTemp', ['innerTemp', 'extTemp', 'lvlBattery']);

    this.payloadsMappings = {
      deviceEUI: { type: 'keyword' }
    };
  }

  async validate (payload: JSONObject, request: KuzzleRequest) {
    if (payload.payloads.find(devicePayload => ! devicePayload.deviceEUI)) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI" in some devicePayload');
    }

    if (payload.invalid) {
      return false;
    }

    return true;
  }

  async decode (payload: JSONObject, request: KuzzleRequest): Promise<DecodedPayload> {
    const decodedPayload: DecodedPayload = new Map();

    for (const devicePayload of payload.payloads) {
      const deviceMeasurements = [];

      if (devicePayload.register1) {
        deviceMeasurements.push({
          deviceMeasureName: 'innerTemp',
          measuredAt: Date.now() - (devicePayload.delayRegister1
            ? devicePayload.delayRegister1
            : 0),
          type: 'temperature',
          values: {
            temperature: devicePayload.register1,
          },
        });
      }

      if (devicePayload.register2) {
        deviceMeasurements.push(
          {
            deviceMeasureName: 'extTemp',
            measuredAt: Date.now() - (devicePayload.delayRegister2
              ? devicePayload.delayRegister2
              : 0),
            type: 'temperature',
            values: {
              temperature: devicePayload.register2,
            },
          });
      }

      if (devicePayload.lvlBattery) {
        deviceMeasurements.push({
          deviceMeasureName: 'lvlBattery',
          measuredAt: Date.now() - (devicePayload.delayLvlBattery
            ? devicePayload.delayLvlBattery
            : 0),
          type: 'battery',
          values: {
            battery: devicePayload.lvlBattery * 100,
          },
        });
      }

      decodedPayload.set(
        devicePayload.deviceEUI, deviceMeasurements);
    }

    return decodedPayload;
  }
}
