import { JSONObject } from 'kuzzle';
import _ from 'lodash';

export function validateBaseMeasure (toValidate: JSONObject): boolean {
  return _.has(toValidate, 'values')
    && _.has(toValidate, 'type');
}
