import { JSONObject, KDocumentContent } from "kuzzle";

import { Metadata } from "../../../modules/shared";
import { AssetMeasureContext } from "../../../modules/asset";

export type MeasureOriginDevice = {
  /**
   * Origin of the measure
   */
  type: "device";

  /**
   * Name of the measure in the device
   */
  measureName: string;

  /**
   * Payload uuids that were used to create this measure.
   */
  payloadUuids: Array<string>;

  /**
   * Model of the device
   *
   * @example "AbeewayTemp"
   */
  deviceModel: string;

  /**
   * Reference of the device
   */
  reference: string;

  /**
   * Device ID
   */
  _id: string;
};

export type MeasureOriginComputed = {
  type: "computed";

  /**
   * String that identify the rule used to compute the measure
   */
  _id: string;

  /**
   * Name of the measure
   */
  measureName: string;

  /**
   * Payload uuids that were used to create this measure for traceability.
   */
  payloadUuids: Array<string>;
};

export type MeasureOrigin = MeasureOriginDevice | MeasureOriginComputed;

/**
 * Represents the content of a measure document.
 */
export interface MeasureContent<
  TMeasureValues extends JSONObject = any,
  TMetadata extends Metadata = any
> extends Measurement<TMeasureValues>,
    KDocumentContent {
  /**
   * Asset linked to the device when the measure was made
   */
  asset?: AssetMeasureContext<TMetadata>;

  /**
   * Define the origin of the measure.
   */
  origin: MeasureOrigin;
}

export type Measurement<TMeasureValues extends JSONObject = any> = {
  /**
   * Type of the measure. (e.g. "temperature")
   */
  type: string;

  /**
   * Micro Timestamp of the measurement time.
   */
  measuredAt: number;

  /**
   * Property containing the actual measurement.
   *
   * This should be specialized by child interfaces.
   */
  values: TMeasureValues;
};

/**
 * Used in the DecodedPayload to store a decoded measure
 */
export type DecodedMeasurement<TMeasureValues extends JSONObject = JSONObject> =
  {
    measureName: string;
  } & Measurement<TMeasureValues>;
