import { JSONObject } from 'kuzzle'

export type Measure = {
  updatedAt: number;
  payloadUuid: string;

  value?: number;

  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
}

export type SensorMeasures = {
  [measureType: string]: Measure;
}

export type AssetMeasures = {
  [measureType: string]: {
    // Sensors info
    id: string;
    model: string;
    reference: string;
    metadata: JSONObject;

    // Measure common info
    updatedAt: number;
    payloadUuid: string;

    value?: number;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    accuracy?: number;
  }
}
