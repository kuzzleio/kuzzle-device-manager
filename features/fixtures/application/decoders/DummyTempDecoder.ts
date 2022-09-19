import { JSONObject, PreconditionError } from 'kuzzle';

import {
  Decoder,
  DecodedPayload,
  TemperatureMeasurement,
  BatteryMeasurement,
} from '../../../../index';

export class DummyTempDecoder extends Decoder {
  public measures = [
    { name: 'theBatteryLevel', type: 'battery' },
    { name: 'temperature', type: 'temperature' },
  ] as const;

  constructor () {
    super();

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

  async decode (payload: JSONObject): Promise<DecodedPayload<Decoder>> {
    const decodedPayload = new DecodedPayload<DummyTempDecoder>(this);

    if (payload?.metadata?.color) {
      decodedPayload.addMetadata(payload.deviceEUI, {
        color: payload.metadata.color
      });
    }

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
        // @ts-expect-error
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
