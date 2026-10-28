import { JSONObject } from "kuzzle-sdk";
import isEqual from "lodash/isEqual";
import isObject from "lodash/isObject";

export function objectDiff(base: JSONObject, object: JSONObject) {
  const changes: string[] = [];

  const walkObject = (_base: any, _object: any, path: any = []) => {
    for (const key of Object.keys(_base)) {
      if (_object[key] === undefined) {
        changes.push([...path, key].join("."));
      }
    }

    for (const key of Object.keys(_object)) {
      if (_base[key] === undefined) {
        changes.push([...path, key].join("."));
      } else if (
        !isEqual(_object[key], _base[key]) &&
        isObject(_object[key]) &&
        isObject(_base[key])
      ) {
        walkObject(_base[key], _object[key], [...path, key]);
      } else if (
        !isObject(_object[key]) &&
        !isObject(_base[key]) &&
        _base[key] !== _object[key]
      ) {
        changes.push([...path, key].join("."));
      }
    }
  };

  walkObject(base, object);

  return changes;
}
