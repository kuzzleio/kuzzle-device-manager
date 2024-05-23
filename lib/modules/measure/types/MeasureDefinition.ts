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
interface MeasureLocales {
  [localeString: string]: {
    friendlyName: string;
    unit?: string;
  };
}
export interface MeasureValuesDetails {
  [valueName: string]: MeasureLocales;
}
/**
 * Represents a measure definition registered by the Device Manager
 *
 * @example
 * {
 *   valuesMappings: { temperature: { type: 'float' } },
 *   valuesDetails: {
 *        temperature:{
 *              en:{
 *                  name:"Temperature",
 *                  unit:"°C"
 *              },fr:{
 *                  name:"Température",
 *                  unit:"°C"
 *              }
 *         }
 *    },
 * }
 */
export interface MeasureDefinition {
  /**
   * Mappings for the measurement values in order to index the fields
   */
  valuesMappings: JSONObject;
  valuesDetails?: {
    [valueName: string]: MeasureLocales;
  };
}
