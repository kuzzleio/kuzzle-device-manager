import { JSONObject } from "kuzzle-sdk";

import { flattenObject } from "./flattenObject";

/**
 * Flattens a measure's `valuesMappings` (an ES-mapping-like object, e.g.
 * `{ readings: { properties: { ch1: { type: "float" }, ch2: { type: "float" } } } }`)
 * into the list of dot-notation leaf paths it declares (e.g.
 * `["readings.ch1", "readings.ch2"]`), suitable for validating a
 * `sourceField`/`targetField` value against what a measure type actually
 * declares.
 */
export function getValuesMappingsLeafPaths(
  valuesMappings: JSONObject,
): string[] {
  return Object.keys(flattenObject(valuesMappings)).map((path) =>
    path.replace(/\.properties/g, "").replace(/\.type$/, ""),
  );
}
