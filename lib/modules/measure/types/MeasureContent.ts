import { JSONObject, KDocumentContent } from "kuzzle";

import { AssetDescription } from "../../../modules/asset";

import { MeasureUnit } from "./MeasureDefinition";

/**
 * Represents a measurement sent with a payload.
 *
 * This interface should be extended and the `values` property specialized
 * to declare new measurement type.
 *
 * @todo cannot use type when iterating on measure of the pipe event
 */
export interface Measurement<
  TMeasurementValues extends JSONObject = JSONObject
> {
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
  values: TMeasurementValues;

  /**
   * Micro Timestamp of the measurement time.
   */
  measuredAt?: number;

  /**
   * Name given by the decoder to the measure.
   *
   * By default, it's the type of the measure
   * @todo device.name
   */
  deviceMeasureName?: string;
}

export interface AssetMeasurement<
  TMeasurementValues extends JSONObject = JSONObject
> extends Measurement<TMeasurementValues> {
  /**
   * Name given by the `deviceLink` of the linked asset.
   * @todo asset.name
   */
  assetMeasureName: string;
}

/**
 * Represent the full content of a measure document.
 */
export interface MeasureContent<
  TMeasurementValues extends JSONObject = JSONObject
> extends KDocumentContent,
    AssetMeasurement<TMeasurementValues> {
  /**
   * Measurement self-description.
   */
  unit?: MeasureUnit;

  /**
   * Asset linked to the device when the measure was made
   */
  asset?: AssetDescription;

  /**
   * Define the origin of the measure.
   */
  origin: {
    /**
     * From what the measure has been pushed.
     */
    type: "user" | "device";

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
  };
}
