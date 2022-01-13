import { JSONObject } from 'kuzzle';

export interface Measure {
  values: JSONObject;

  measuredAt: number;
}
