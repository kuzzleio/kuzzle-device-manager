import { JSONObject, PreconditionError } from 'kuzzle';

import {
  Decoder,
  BatteryMeasurement,
  PositionMeasurement,
  TemperatureMeasurement,
  DecodedPayload,
} from '../../../../index';

export class DummyTempPositionDecoder extends Decoder {
  constructor () {
    super();

    this.measures = [
      { name: 'theTemperature', type: 'temperature' },
      { name: 'theBattery', type: 'battery' },
      { name: 'thePosition', type: 'position' },
    ];
  }

  async validate (payload: JSONObject) {
    if (payload.deviceEUI === undefined) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI"');
    }

    return true;
  }

  async decode (payload: JSONObject): Promise<DecodedPayload> {
    const decodedPayload = new DecodedPayload();

    decodedPayload.addMeasurement<TemperatureMeasurement>(
      payload.deviceEUI,
      {
      deviceMeasureName: 'theTemperature',
      measuredAt: Date.now(),
      type: 'temperature',
      values: { temperature: payload.register55 },
    });

    decodedPayload.addMeasurement<PositionMeasurement>(
      payload.deviceEUI,
      {
      deviceMeasureName: 'thePositition',
      measuredAt: Date.now(),
      type: 'position',
      values: {
        position: {
          lat: payload.location.lat,
          lon: payload.location.lon,
        },
        accuracy: payload.location.accu,
      },
    });

    decodedPayload.addMeasurement<BatteryMeasurement>(
      payload.deviceEUI,
      {
      deviceMeasureName: 'theBattery',
      measuredAt: Date.now(),
      type: 'battery',
      values: {
        battery: payload.batteryLevel * 100,
      },
    });

    return decodedPayload;
  }
}
