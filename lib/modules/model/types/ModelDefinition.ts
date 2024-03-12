import { Decoder, NamedMeasures } from "../../../modules/decoder";
import {
  DefaultMetadata,
  MetadataDetails,
  MetadataGroups,
  MetadataMappings,
} from "./ModelContent";

/**
 * Define an asset model
 *
 * @example
 *   {
 *     measures: [
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
 *     },
 *     metadataDetails: {
 *       "extTemp": {
 *         "group": "buildingEnv",
 *         "locales": {
 *           "en": {
 *             "friendlyName": "External temperature",
 *             "description": "Container external temperature"
 *           },
 *           "fr": {
 *             "friendlyName": "Température externe",
 *             "description": "Température externe du conteneur"
 *           }
 *         }
 *       }
 *     },
 *     metadataGroups: {
 *       "buildingEnv": {
 *         "locales": {
 *           "en": {
 *             "groupFriendlyName": "Building environment"
 *           },
 *           "fr": {
 *             "groupFriendlyName": "Environnement du bâtiment"
 *           }
 *         }
 *       }
 *     }
 *   }
 *
 */
export type AssetModelDefinition = {
  /**
   * Array describing measures names and types
   */
  measures: NamedMeasures;

  /**
   * Metadata mappings definition
   */
  metadataMappings?: MetadataMappings;

  /**
   * Default metadata values
   */
  defaultMetadata?: DefaultMetadata;

  /**
   * Metadata details including tanslations and group.
   */
  metadataDetails?: MetadataDetails;

  /**
   * Metadata groups
   */
  metadataGroups?: MetadataGroups;
};

/**
 * Define a device model
 *
 * @example
 *   {
 *     decoder: new DummyTempPositionDecoder(),
 *     metadataMappings: {
 *       serial: { type: "keyword" },
 *     },
 *     defaultMetadata: {
 *       company: "Firebird"
 *     },
 *     metadataDetails: {
 *       sensorType: {
 *         group: "sensorSpecs",
 *         locales: {
 *           en: {
 *             friendlyName: "Sensor type",
 *             description: "Type of the sensor"
 *           },
 *           fr: {
 *             friendlyName: "Type de traceur",
 *             description: "Type du traceur"
 *           }
 *         }
 *       }
 *     },
 *     metadataGroups: {
 *       sensorSpecs: {
 *         locales: {
 *           en: {
 *             groupFriendlyName: "Sensors specifications"
 *           },
 *           fr: {
 *             groupFriendlyName: "Spécifications des capteurs"
 *           }
 *         }
 *       }
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
  metadataMappings?: MetadataMappings;

  /**
   * Default metadata values
   */
  defaultMetadata?: DefaultMetadata;

  /**
   * Metadata details including tanslations and group.
   */
  metadataDetails?: MetadataDetails;

  /**
   * Metadata groups list and details.
   */
  metadataGroups?: MetadataGroups;
};
