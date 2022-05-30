import { JSONObject } from 'kuzzle';
import _ from 'lodash';

export function validateMeasurement (toValidate: JSONObject): boolean {
  return _.has(toValidate, 'values')
    && _.has(toValidate, 'type');
}
