import { JSONObject, KDocumentContent } from "kuzzle-sdk";

import { Metadata } from "../../../modules/shared";
import { AssetMeasureContext } from "../../../modules/asset";

interface AbstractMeasureOrigin {
  /**
   * Origin of the measure
   */
  type: string;

  /**
   * Name of the measure
   */
  measureName: string;

  /**
   * Payload uuids that were used to create this measure.
   */
  payloadUuids: Array<string>;
}

export interface MeasureOriginDevice extends AbstractMeasureOrigin {
  type: "device";

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
}

export interface MeasureOriginComputed extends AbstractMeasureOrigin {
  /**
   * Computed measures are not automatically added into the asset and device
   * documents at the end of the ingestion pipeline.
   */
  type: "computed";

  /**
   * String that identify the rule used to compute the measure
   */
  _id: string;
}

export interface MeasureOriginApi extends AbstractMeasureOrigin {
  type: "api";

  /**
   * API ID
   */
  _id: string;
}

export type MeasureOrigin =
  | MeasureOriginDevice
  | MeasureOriginComputed
  | MeasureOriginApi;

/**
 * Represents the content of a measure document.
 */
export interface MeasureContent<
  TMeasureValues extends JSONObject = any,
  TMetadata extends Metadata = any,
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
