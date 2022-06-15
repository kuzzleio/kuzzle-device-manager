import { JSONObject, KDocumentContent } from 'kuzzle';

import { MeasureUnit } from './MeasureDefinition';

/**
 * Represents a measurement of a value to post
 *
 * This interface should be extended and the `values` property specialized
 * to declare new measurement type.
 */
export interface Measurement {
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
   * Micro Timestamp of the measurement time
   */
  measuredAt: number;

  /**
   * Name given by the decode to the measure
   */
  deviceMeasureName: string;
}

export interface AssetMeasurement extends Measurement {
  /**
   * A device may have different measures for the same type (e.g. measure temperature 2 times)
   * Should be set when you link the device to the asset
   */
  assetMeasureName: string;
}

/**
 * Represent the full content of a measure document.
 */
export interface MeasureContent extends KDocumentContent, AssetMeasurement {
  /**
   * Define the origin of the measure
   */
  origin: {
    /**
     * Measurement self-description
     */
    unit: MeasureUnit;

    /**
     * E.g. "device"
     */
    type: OriginType;

    /**
     * Array of payload uuids that were used to create this measure.
     */
    payloadUuid?: string;

    /**
     * E.g. "AbeewayTemp"
     */
    deviceModel?: string;

    /**
     * ID of the origin.
     * - device id if origin type is `device`
     * - user id if origin type is `asset`
     */
    id?: string;

    /**
     * Asset ID linked to the device when the measure was made
     */
    assetId?: string;
  }
}

/**
 * From where the measure has been pushed
 */
export enum OriginType {
  ASSET = 'asset',
  DEVICE = 'device',
}
