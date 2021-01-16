import { JSONObject } from "kuzzle"

export type Measure = {
  updatedAt: number;
  payloadUuid: string;

  value?: number;

  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
}

export type TagMeasures = {
  [measureType: string]: Measure;
}

export type AssetMeasures = {
  [measureType: string]: {
    // Sensors info
    id: string;
    model: string;
    manufacturerId: string;
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
