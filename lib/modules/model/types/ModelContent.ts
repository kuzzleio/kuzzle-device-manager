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
}

export interface MetadataMappings {
  [key: string]:
    | MetadataProperty
    | { properties: { [key: string]: MetadataProperty } };
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
  label?: string; // TODO: ajouter la possibilité de stocker le locales en anglais aussi
  metadataPath: string;
  unit?: string;
}

export interface MeasureTooltipContent {
  category: "measure";
  label?: string; // TODO: dito
  measureSlot: string;
  measureValuePath: string;
  unit?: string;
}

export interface StandardTooltipContent {
  category: "standard";
  label?: string; // TODO: dito²
  type: StandardTooltipContentType;
  value: string;
}

export enum StandardTooltipContentType {
  link = "link",
  image = "image",
  text = "text",
  title = "title",
}

export interface TooltipModels {
  [key: string]: {
    tooltipLabel: string; // TODO: dito²
    content: (
      | MetadataTooltipContent
      | MeasureTooltipContent
      | StandardTooltipContent
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
     *     "en": {
     *        "friendlyName": "External temperature",
     *        "description": "Building external temperature"
     *     },
     *     "fr": {
     *       "friendlyName": "Température extérieure",
     *       "description": "Température à l'exterieur du bâtiment"
     *     },
     *   }
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
     *     "tooltipLabel": "Default Tooltip Model",
     *     "content": [
     *       {
     *         "category": "metadata",
     *         "label": "Etage de la salle",
     *         "metadataPath": "floor"
     *       },
     *       {
     *         "category": "measure",
     *         "label": "Température extérieure",
     *         "measureSlot": "externalTemperature",
     *         "measureValuePath": "externalTemperature"
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
     *     "en": {
     *        "friendlyName": "Sensor version",
     *        "description": "Firmware version of the sensor"
     *     },
     *     "fr": {
     *       "friendlyName": "Version du capteur",
     *       "description": "Version du micrologiciel du capteur"
     *     },
     *   }
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
     *       }
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
