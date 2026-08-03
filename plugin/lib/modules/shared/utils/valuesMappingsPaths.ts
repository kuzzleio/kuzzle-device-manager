import { JSONObject } from "kuzzle-sdk";

import { flattenObject } from "./flattenObject";

export function getValuesMappingsLeafPaths(
  valuesMappings: JSONObject,
): string[] {
  return Object.keys(flattenObject(valuesMappings)).map((path) =>
    path.replace(/\.properties/g, "").replace(/\.type$/, ""),
  );
}
