import { JSONObject, PreconditionError } from 'kuzzle';

import {
  Decoder,
  DecodedPayload,
  TemperatureMeasurement,
  BatteryMeasurement,
} from '../../../../index';

export class DummyTempDecoder extends Decoder {
  constructor () {
    super();

    this.measures = [
      { name: 'theBatteryLevel', type: 'battery' },
      { name: 'temperature', type: 'temperature' },
    ];

    this.payloadsMappings = {
      deviceEUI: { type: 'keyword' }
    };
  }

  async validate (payload: JSONObject) {
    if (! payload.deviceEUI) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI"');
    }

    if (payload.invalid) {
      return false;
    }

    return true;
  }

  async decode (payload: JSONObject): Promise<DecodedPayload> {
    const decodedPayload = new DecodedPayload(this);

    decodedPayload.addMeasurement<TemperatureMeasurement>(
      payload.deviceEUI,
      'temperature',
      {
        measuredAt: Date.now(),
        type: 'temperature',
        values: {
          temperature: payload.register55,
        },
      });

    decodedPayload.addMeasurement<BatteryMeasurement>(
      payload.deviceEUI,
      'theBatteryLevel',
      {
        measuredAt: Date.now(),
        type: 'battery',
        values: {
          battery: payload.batteryLevel * 100,
        },
      });

    if (payload.unknownMeasure) {
      decodedPayload.addMeasurement<TemperatureMeasurement>(
        payload.deviceEUI,
        'unknownMeasureName',
        {
          measuredAt: Date.now(),
          type: 'temperature',
          values: {
            temperature: payload.unknownMeasure,
          },
        });
    }

    return decodedPayload;
  }
}
