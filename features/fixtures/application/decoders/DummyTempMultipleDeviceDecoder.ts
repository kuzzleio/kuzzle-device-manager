import { JSONObject, KuzzleRequest, PreconditionError } from 'kuzzle';

import {
  Decoder,
  DecodedPayload,
  TemperatureMeasurement,
  BatteryMeasurement,
} from '../../../../index';

export class DummyTempMultipleDeviceDecoder extends Decoder {
  constructor () {
    super('DummyTempMultipleDevice', ['innerTemp', 'extTemp', 'batteryLevel']);

    this.payloadsMappings = {
      deviceEUI: { type: 'keyword' }
    };
  }

  async validate (payload: JSONObject, request: KuzzleRequest) {
    if (payload.payloads.find(payload => ! payload.deviceEUI)) {
      throw new PreconditionError('Invalid payload: missing "deviceEUIs"');
    }

    if (payload.invalid) {
      return false;
    }

    return true;
  }

  async decode (payload: JSONObject, request: KuzzleRequest): Promise<DecodedPayload> {
    const decodedPayload: DecodedPayload = new Map();
    for (const devicePayload of payload.payloads) {

      const innerTemp: TemperatureMeasurement = {
        deviceMeasureName: 'innerTemp',
        measuredAt: Date.now(),
        type: 'temperature',
        values: {
          temperature: devicePayload.register1,
        },
      };

      const extTemp: TemperatureMeasurement = {
        deviceMeasureName: 'extTemp',
        measuredAt: Date.now(),
        type: 'temperature',
        values: {
          temperature: devicePayload.register2,
        },
      };

      const battery: BatteryMeasurement = {
        deviceMeasureName: 'theBatteryLevel',
        measuredAt: Date.now(),
        type: 'battery',
        values: {
          battery: devicePayload.batteryLevel * 100,
        },
      };

      decodedPayload.set(
        devicePayload.deviceEUI, [innerTemp, extTemp, battery]);
    }

    return decodedPayload;
  }
}
