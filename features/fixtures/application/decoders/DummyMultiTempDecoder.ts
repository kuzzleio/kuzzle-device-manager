import { JSONObject, PreconditionError } from 'kuzzle';

import {
  Decoder,
  DecodedPayload,
  TemperatureMeasurement,
  BatteryMeasurement,
  MeasuresRegister,
} from '../../../../index';

export class DummyMultiTempDecoder extends Decoder {
  public measures = [
    { name: 'innerTemp', type: 'temperature' },
    { name: 'outerTemp', type: 'temperature' },
    { name: 'lvlBattery', type: 'battery' },
  ] as const;

  constructor () {
    super();

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

  async decode (payload: JSONObject): Promise<DecodedPayload<Decoder>> {
    const decodedPayload = new DecodedPayload<DummyMultiTempDecoder>(this);

    for (const devicePayload of payload.payloads) {
      if (devicePayload.registerInner) {
        const innerTemp: TemperatureMeasurement = {
          measuredAt: devicePayload.measuredAtRegisterInner ?? Date.now(),
          type: 'temperature',
          values: {
            temperature: devicePayload.registerInner,
          },
        }

        decodedPayload.addMeasurement(devicePayload.deviceEUI, 'innerTemp', innerTemp);
      }

      if (devicePayload.registerOuter) {
        const outerTemp: TemperatureMeasurement = {
          measuredAt: devicePayload.measuredAtRegisterOuter ?? Date.now(),
          type: 'temperature',
          values: {
            temperature: devicePayload.registerOuter,
          },
        };

        decodedPayload.addMeasurement(devicePayload.deviceEUI, 'outerTemp', outerTemp);
      }

      if (devicePayload.lvlBattery) {
        const battery: BatteryMeasurement = {
          measuredAt: devicePayload.measuredAtLvlBattery ?? Date.now(),
          type: 'battery',
          values: {
            battery: devicePayload.lvlBattery * 100,
          },
        }

        decodedPayload.addMeasurement(devicePayload.deviceEUI, 'lvlBattery', battery);
      }
    }

    return decodedPayload;
  }
}
