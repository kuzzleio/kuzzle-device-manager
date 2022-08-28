import { JSONObject, PreconditionError } from 'kuzzle';

import {
  Decoder,
  DecodedPayload,
  TemperatureMeasurement,
  BatteryMeasurement,
  MeasuresRegister,
} from '../../../../index';

export class DummyMultiTempDecoder extends Decoder {
  constructor () {
    super();

    this.measures = [
      { name: 'innerTemp', type: 'temperature' },
      { name: 'outerTemp', type: 'temperature' },
      { name: 'lvlBattery', type: 'battery' },
    ];

    this.payloadsMappings = {
      deviceEUI: { type: 'keyword' }
    };
  }

  async validate (payload: JSONObject) {
    if (payload.payloads.find(devicePayload => ! devicePayload.deviceEUI)) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI" in some devicePayload');
    }

    if (payload.invalid) {
      return false;
    }

    return true;
  }

  async decode (payload: JSONObject): Promise<DecodedPayload> {
    const decodedPayload = new DecodedPayload();

    for (const devicePayload of payload.payloads) {
      if (devicePayload.registerInner) {
        const innerTemp: TemperatureMeasurement = {
          deviceMeasureName: 'innerTemp',
          measuredAt: devicePayload.measuredAtRegisterInner ?? Date.now(),
          type: 'temperature',
          values: {
            temperature: devicePayload.registerInner,
          },
        }

        decodedPayload.addMeasurement(devicePayload.deviceEUI, innerTemp);
      }

      if (devicePayload.registerOuter) {
        const outerTemp: TemperatureMeasurement = {
          deviceMeasureName: 'outerTemp',
          measuredAt: devicePayload.measuredAtRegisterOuter ?? Date.now(),
          type: 'temperature',
          values: {
            temperature: devicePayload.registerOuter,
          },
        };

        decodedPayload.addMeasurement(devicePayload.deviceEUI, outerTemp);
      }

      if (devicePayload.lvlBattery) {
        const battery: BatteryMeasurement = {
          deviceMeasureName: 'lvlBattery',
          measuredAt: devicePayload.measuredAtLvlBattery ?? Date.now(),
          type: 'battery',
          values: {
            battery: devicePayload.lvlBattery * 100,
          },
        }

        decodedPayload.addMeasurement(devicePayload.deviceEUI, battery);
      }
    }

    return decodedPayload;
  }
}
