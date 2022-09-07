import { JSONObject } from 'kuzzle';

import {
    DecodedPayload, Decoder
} from '../../../../index';
import { Acceleration3dMeasurement } from '../measures/Acceleration3dMeasure';

export class DummyAccelerometer3dDecoder extends Decoder {
  public measures = [
    { name: 'acceleration3d', type: 'acceleration3d' },
  ] as const;

  constructor () {
    super();

    this.payloadsMappings = {
      deviceEUI: { type: 'keyword' }
    };
  }

  async validate (payload: JSONObject) {
    return payload.x && payload.y && payload.z && payload.id;
  }

  async decode (payload: JSONObject): Promise<DecodedPayload<Decoder>> {
    const decodedPayload = new DecodedPayload<DummyAccelerometer3dDecoder>(this);

    const measurement: Acceleration3dMeasurement = {
      measuredAt: Date.now(),
      type: 'acceleration3d',
      values: {
        x: payload.x,
        y: payload.y,
        z: payload.z,
      }
    }

    decodedPayload.addMeasurement(payload.id, 'acceleration3d', measurement);

    return decodedPayload;
  }
}
