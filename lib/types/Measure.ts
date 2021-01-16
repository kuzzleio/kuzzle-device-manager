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
    id: string;
    model: string;
    manufacturerId: string;

    updatedAt: number;
    payloadUuid: string;
    temperature?: number;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    accuracy?: number;

    metadata: JSONObject;
  }
}
