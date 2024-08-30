import { JSONObject, KDocumentContent } from "kuzzle-sdk";

import { NamedMeasures } from "../../../modules/decoder";

import { MeasureDefinition } from "../../measure";

export interface MeasureModelContent extends KDocumentContent {
  type: "measure";

  measure: MeasureDefinition & {
    type: string;
  };
}
interface MetadataProperty {
  type: string;
  strategy?: string;
  format?: string;
}

interface MetadataObject {
  properties: {
    [key: string]: MetadataProperty | MetadataObject;
  };
}

export interface MetadataMappings {
  [key: string]: MetadataProperty | MetadataObject;
}

interface LocaleDetails {
  friendlyName: string;
  description: string;
}

export interface MetadataDetails {
  [key: string]: {
    group?: string;
    locales: {
      [locale: string]: LocaleDetails;
    };
    definition?: {
      readOnly?: boolean;
      type?: string;
      values?: string[] | number[] | boolean[];
      customValueAllowed?: boolean;
    };
  };
}

interface MetadataGroupLocale {
  groupFriendlyName: string;
  description: string;
}

export interface MetadataGroups {
  [groupName: string]: {
    locales: {
      [locale: string]: MetadataGroupLocale;
    };
  };
}

export interface MetadataTooltipContent {
  category: "metadata";
  label?: {
    locales: {
      [locale: string]: LocaleDetails;
    };
  };
  metadataPath: string;
  suffix?: string;
}

export interface MeasureTooltipContent {
  category: "measure";
  label?: {
    locales: {
      [locale: string]: LocaleDetails;
    };
  };
  measureSlot: string;
  measureValuePath: string;
  suffix?: string;
}

export interface StaticTooltipContent {
  category: "static";
  label?: {
    locales: {
      [locale: string]: LocaleDetails;
    };
  };
  type: StaticTooltipContentType;
  value: string;
}

export enum StaticTooltipContentType {
  link = "link",
  image = "image",
  text = "text",
  title = "title",
  separator = "separator",
}

export interface TooltipModels {
  [key: string]: {
    tooltipLabel: string;
    content: (
      | MetadataTooltipContent
      | MeasureTooltipContent
      | StaticTooltipContent
    )[];
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
    metadataMappings: MetadataMappings;

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
     * Metadata details
     * @example
     * {
     *   "extTemp": {
     *     "group": "buildingEnv",
     *     "locales": {
     *       "en": {
     *          "friendlyName": "External temperature",
     *          "description": "Building external temperature"
     *       },
     *       "fr": {
     *         "friendlyName": "Température extérieure",
     *         "description": "Température à l'exterieur du bâtiment"
     *       },
     *     },
     *     "definition": {
     *       "readOnly": true,
     *       "type": "string",
     *       "values": ["red", "blue", "green"],
     *       "customValueAllowed": true,
     *     }
     *   }
     * }
     */
    metadataDetails?: MetadataDetails;
    /**
     * Metadata groups list
     * @example
     * {
     *   "buildingEnv": {
     *     "locales": {
     *       "en": {
     *         "groupFriendlyName": "Building environment",
     *         "description": "The building environment"
     *       },
     *       "fr": {
     *         "groupFriendlyName": "Environnement du bâtiment",
     *         "description": "L'environnement du bâtiment"
     *       }
     *     }
     *   }
     * }
     */
    metadataGroups?: MetadataGroups;
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
    /**
     * List of tooltip models for this asset model
     *
     * @example
     * [
     *   "defaultTooltipKey": {
     *     "tooltipLabel": "Default tooltip model",
     *     "content": [
     *       {
     *         "metadataPath": "geolocation",
     *         "label": {
     *           "locales": {
     *             "en": {
     *               "description": "",
     *               "friendlyName": "Container position"
     *             },
     *             "fr": {
     *               "description": "",
     *               "friendlyName": "Position du conteneur"
     *             }
     *           }
     *         },
     *         "category": "metadata"
     *       },
     *       {
     *         "measureValuePath": "externalTemperature",
     *         "measureSlot": "externalTemperature",
     *         "label": {
     *           "locales": {
     *             "en": {
     *               "description": "",
     *               "friendlyName": "External temperature"
     *             },
     *             "fr": {
     *               "description": "",
     *               "friendlyName": "Température extérieure"
     *             }
     *           }
     *         },
     *         "category": "measure",
     *         "suffix": "°C"
     *       }
     *     ]
     *   }
     * ]
     */
    tooltipModels?: TooltipModels;
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
    metadataMappings: MetadataMappings;
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
     * Metadata details
     * @example
     * {
     *   "sensorVersion": {
     *     "group": "sensorSpecs",
     *     "locales": {
     *       "en": {
     *          "friendlyName": "Sensor version",
     *          "description": "Firmware version of the sensor"
     *       },
     *       "fr": {
     *         "friendlyName": "Version du capteur",
     *         "description": "Version du micrologiciel du capteur"
     *       },
     *     "definition": {
     *       "readOnly": true,
     *       "type": "string",
     *       "values": ["red", "blue", "green"],
     *       "customValueAllowed": true,
     *     }
     *   }
     * }
     */
    metadataDetails?: MetadataDetails;
    /**
     * Metadata groups list
     * @example
     * {
     *   "sensorSpecs": {
     *     "locales": {
     *       "en": {
     *         "groupFriendlyName": "Sensor specifications",
     *         "description" : "All sensors specifications"
     *       },
     *       "fr": {
     *         "groupFriendlyName": "Spécifications techniques",
     *         "description": "Toutes les spécifications techniques"
     *       },
     *     }
     *   }
     * }
     */
    metadataGroups?: MetadataGroups;
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
