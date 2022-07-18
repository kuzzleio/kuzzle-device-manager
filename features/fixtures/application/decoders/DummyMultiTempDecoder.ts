import { JSONObject, KuzzleRequest, PreconditionError } from 'kuzzle';

import {
  Decoder,
  DecodedPayload,
  TemperatureMeasurement,
  BatteryMeasurement,
  MeasuresRegister,
} from '../../../../index';

export class DummyMultiTempDecoder extends Decoder {
  constructor (measuresRegister: MeasuresRegister) {
    super('DummyMultiTemp', {
      'innerTemp': 'temperature',
      'outerTemp': 'temperature',
      'lvlBattery': 'battery',
    },
      measuresRegister);

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
    const decodedPayload: DecodedPayload = {};

    for (const devicePayload of payload.payloads) {
      const deviceMeasurements = [];

      if (devicePayload.registerInner) {
        deviceMeasurements.push({
          deviceMeasureName: 'innerTemp',
          measuredAt: devicePayload.measuredAtRegisterInner ?? Date.now(),
          type: 'temperature',
          values: {
            temperature: devicePayload.registerInner,
          },
        });
      }

      if (devicePayload.registerOuter) {
        deviceMeasurements.push(
          {
            deviceMeasureName: 'outerTemp',
            measuredAt: devicePayload.measuredAtRegisterOuter ?? Date.now(),
            type: 'temperature',
            values: {
              temperature: devicePayload.registerOuter,
            },
          });
      }

      if (devicePayload.lvlBattery) {
        deviceMeasurements.push({
          deviceMeasureName: 'lvlBattery',
          measuredAt: devicePayload.measuredAtLvlBattery ?? Date.now(),
          type: 'battery',
          values: {
            battery: devicePayload.lvlBattery * 100,
          },
        });
      }

      decodedPayload[devicePayload.deviceEUI] = deviceMeasurements;
    }

    return decodedPayload;
  }
}
