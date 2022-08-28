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

    // The list is missing the temperature measure on purpose
    this.measures = [
      { name: 'theBatteryLevel', type: 'battery' },
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
    const decodedPayload = new DecodedPayload();

    decodedPayload.addMeasurement<TemperatureMeasurement>(
      payload.deviceEUI,
      {
        measuredAt: Date.now(),
        type: 'temperature',
        values: {
          temperature: payload.register55,
        },
      });

    decodedPayload.addMeasurement<BatteryMeasurement>(
      payload.deviceEUI,
      {
        deviceMeasureName: 'theBatteryLevel',
        measuredAt: Date.now(),
        type: 'battery',
        values: {
          battery: payload.batteryLevel * 100,
        },
      });

    return decodedPayload;
  }
}
