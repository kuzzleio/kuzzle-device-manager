import { JSONObject, KDocumentContent } from "kuzzle";

import { MeasureDefinition } from "../../measure";

export interface MeasureModelContent extends KDocumentContent {
  type: "measure";

  measure: MeasureDefinition & {
    name: string;
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
    defaultValues: JSONObject;
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
    defaultValues: JSONObject;
  };
}

export type ModelContent =
  | MeasureModelContent
  | AssetModelContent
  | DeviceModelContent;
