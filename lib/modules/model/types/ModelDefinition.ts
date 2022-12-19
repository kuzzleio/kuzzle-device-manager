import { JSONObject } from "kuzzle";

import { Decoder, NamedMeasures } from "../../../modules/decoder";

/**
 * Define an asset model
 *
 * @example
 *   {
 *     measuresNames: [
 *       { name: "temperatureExt", type: "temperature" },
 *       { name: "temperatureInt", type: "temperature" },
 *       { name: "position", type: "position" },
 *     ],
 *     metadataMappings: {
 *       weight: { type: "integer" },
 *       height: { type: "integer" },
 *     },
 *     defaultMetadata: {
 *       height: 20
 *     }
 *   }
 *
 */
export type AssetModelDefinition = {
  /**
   * Array describing measures names and types
   */
  measuresNames: NamedMeasures;

  /**
   * Metadata mappings definition
   */
  metadataMappings: JSONObject;

  /**
   * Default metadata values
   */
  defaultMetadata?: JSONObject;
};

/**
 * Define a device model
 *
 * @example
 *   {
 *     decoder: new DummyTempPositionDecoder(),
 *     metadataMappings: {
 *       serial: { type: "keyword" },
 *     }
 *   }
 *
 */
export type DeviceModelDefinition = {
  /**
   * Decoder used to decode payloads
   */
  decoder: Decoder;
  /**
   * Metadata mappings definition
   */
  metadataMappings?: JSONObject;
  /**
   * Default metadata values
   */
  defaultMetadata?: JSONObject;
};
