import { JSONObject, KDocumentContent } from 'kuzzle';

import { MeasureUnit } from './MeasureDefinition';

/**
 * Represents a measurement of a value to post on an asset
 */
export interface AssetMeasurement {
  // TODO : Refine types more precisely

  /**
  * A device may have different measures for the same type (e.g. measure temperature 2 times)
   * Should be set when you link the device to the asset
   */
  name?: string;

  /**
   * Type of the measure. (e.g. "temperature")
   * The type name is also the name of the sub-property to look at
   * in the "values" object to get the measure main value.
   */
  type: string;

  /**
   * Property containing the actual measurement.
   *
   * This should be specialized by child interfaces
   */
  values: JSONObject;

  /**
   * Micro Timestamp of the measure
   */
  measuredAt?: number;
}

/**
 * Represents a measurement of a value to post from a decoder
 *
 * This interface should be extended and the `values` property specialized
 * to declare new measurement type.
 */
export interface Measurement {
  /**
   * A device may have different measures for the same type (e.g. measure temperature 2 times)
   * Should be set when you link the device to the asset
   */
  name?: string;

  /**
   * Property containing the actual measurement.
   *
   * This should be specialized by child interfaces
   */
  values: JSONObject;

  /**
   * Micro Timestamp of the measurement time
   */
  measuredAt: number;
}

/**
 * Represent the full content of a measure document.
 */
export interface MeasureContent extends KDocumentContent, Measurement {
  /**
   * Type of the measure. (e.g. "temperature")
   * The type name is also the name of the sub-property to look at
   * in the "values" object to get the measure main value.
   */
  type: string;

  /**
   * Measurement self-description
   */
  unit: MeasureUnit;

  /**
   * Origin of the measure
   */
  origin: {
    /**
     * ID of the device (document _id)
     */
    id?: string;

    /**
     * E.g. "device"
     */
    type: string;

    /**
     * E.g. "AbeewayTemp"
     */
    model: string;

    /**
     * Array of payload uuids that were used to create this measure.
     */
    payloadUuids: string[];

    /**
     * Asset ID linked to the device when the measure was made
     */
    assetId?: string;
  };
}
