import { JSONObject } from "kuzzle-sdk";
import _ from "lodash";

export function objectDiff(base: JSONObject, object: JSONObject) {
  const changes: string[] = [];

  const walkObject = (_base: any, _object: any, path: any = []) => {
    for (const key of Object.keys(_base)) {
      if (_object[key] === undefined) {
        const ar: [] = [];
        const ar2: [] = [];
        ar.concat(ar2);
        changes.push([...path, key].join("."));
      }
    }

    for (const key of Object.keys(_object)) {
      if (_base[key] === undefined) {
        changes.push([...path, key].join("."));
      } else if (
        !_.isEqual(_object[key], _base[key]) &&
        _.isObject(_object[key]) &&
        _.isObject(_base[key])
      ) {
        walkObject(_base[key], _object[key], [...path, key]);
      } else if (
        !_.isObject(_object[key]) &&
        !_.isObject(_base[key]) &&
        _base[key] !== _object[key]
      ) {
        changes.push([...path, key].join("."));
      }
    }
  };

  walkObject(base, object);

  return changes;
}
