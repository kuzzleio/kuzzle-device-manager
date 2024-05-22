import { JSONObject } from "kuzzle-sdk";

/* *
 * Represents a measure information and localization
 *
 * @example
 * {
 *    locales: {
 *              en:{
 *                  name:"Temperature",
 *                  unit:"°C"
 *              },fr:{
 *                  name:"Température",
 *                  unit:"°C"
 *              }
 *    },
 * }
 */
export interface MeasureLocales {
  [localeString: string]: {
    name: string;
    unit?: string;
  };
}

/**
 * Represents a measure definition registered by the Device Manager
 *
 * @example
 * {
 *   valuesMappings: { temperature: { type: 'float' } },
 *   locales: {
 *              en:{
 *                  name:"Temperature",
 *                  unit:"°C"
 *              },fr:{
 *                  name:"Température",
 *                  unit:"°C"
 *              }
 *    },
 * }
 */
export interface MeasureDefinition {
  /**
   * Mappings for the measurement values in order to index the fields
   */
  valuesMappings: JSONObject;
  locales?: MeasureLocales;
}
