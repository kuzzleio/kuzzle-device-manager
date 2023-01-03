import { JSONObject, KDocumentContent } from "kuzzle";

import { NamedMeasures } from "../../../modules/decoder";

import { MeasureDefinition } from "../../measure";

export interface MeasureModelContent extends KDocumentContent {
  type: "measure";

  measure: MeasureDefinition & {
    type: string;
  };
}

export interface AssetModelContent extends KDocumentContent {
  type: "asset";

  engineGroup: string;

  asset: {
    /**
     * Name of the model
     */
    model: string;

    /**
     * Metadata mappings.
     *
     * @example
     * {
     *   "company": {
     *     "properties": {
     *        "name": { "type": "keyword" },
     *      }
     *   }
     * }
     */
    metadataMappings: JSONObject;

    /**
     * Default values for metadata.
     *
     * @example
     * {
     *    "company.name": "Firebird"
     * }
     */
    defaultMetadata: JSONObject;

    /**
     * List of accepted measures for this model
     *
     * Array<{ type: string, name: string }>
     *
     * @example
     *
     * [
     *   { type: "temperature", name: "externalTemperature" }
     * ]
     */
    measures: NamedMeasures;
  };
}

export interface DeviceModelContent extends KDocumentContent {
  type: "device";

  device: {
    /**
     * Name of the model
     */
    model: string;

    /**
     * Metadata mappings.
     *
     * @example
     * {
     *   "company": {
     *     "properties": {
     *        "name": { "type": "keyword" },
     *      }
     *   }
     * }
     */
    metadataMappings: JSONObject;

    /**
     * Default values for metadata.
     *
     * @example
     * {
     *    "company.name": "Firebird"
     * }
     */
    defaultMetadata: JSONObject;

    /**
     * List of decoded measures for this model
     *
     * Array<{ type: string, name: string }>
     *
     * @example
     *
     * [
     *   { type: "temperature", name: "externalTemperature" }
     * ]
     */
    measures: NamedMeasures;
  };
}

export type ModelContent =
  | MeasureModelContent
  | AssetModelContent
  | DeviceModelContent;
