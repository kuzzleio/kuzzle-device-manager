import { JSONObject, KDocumentContent } from 'kuzzle';

import { MeasureUnit } from './MeasureDefinition';

/**
 * Represents a measurement sent with a payload.
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
   * This should be specialized by child interfaces.
   */
  values: JSONObject;

  /**
   * Micro Timestamp of the measurement time.
   */
  measuredAt: number;

  /**
   * Name given by the decoder to the measure.
   */
  deviceMeasureName?: string;
}

export interface AssetMeasurement extends Measurement {
  /**
   * Name given by the `deviceLink` of the linked asset.
   */
  assetMeasureName: string;
}

/**
 * Represent the full content of a measure document.
 */
export interface MeasureContent extends KDocumentContent, AssetMeasurement {
  /**
   * Measurement self-description.
   */
  unit: MeasureUnit;

  /**
   * Define the origin of the measure.
   */
  origin: {
    /**
     * From what the measure has been pushed.
     */
    type: OriginType;

    /**
     * Payload uuid that was used to create this measure.
     */
    payloadUuids?: Array<string>;

    /**
     * E.g. "AbeewayTemp".
     */
    deviceModel?: string;

    /**
     * ID of the origin. Can be:
     * - device id if origin type is `device`
     * - kuid of the request if origin type is `user`
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
  USER = 'user',
  DEVICE = 'device',
}
