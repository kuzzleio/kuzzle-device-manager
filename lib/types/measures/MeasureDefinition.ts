import { JSONObject } from 'kuzzle';

export interface MeasureUnit {
  name: string;

  sign: string;

  type: string;
}

export interface MeasureDefinition {
  unit: MeasureUnit;

  mappings: JSONObject;
}
