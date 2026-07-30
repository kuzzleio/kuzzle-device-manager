import { JSONObject, KDocumentContent } from "kuzzle-sdk";

import { Metadata } from "../../shared";
import { AssetMeasureContext } from "../../asset";

interface AbstractMeasureOrigin {
  /**
   * Origin of the measure
   */
  type: string;

  /**
   * Payload uuids that were used to create this measure.
   */
  payloadUuids: Array<string>;

  /**
   * Custom metadata provided by the user
   */
  metadata?: Metadata;
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
   * Name of the measure
   */
  measureName: string;

  /**
   * Reference of the device
   */
  reference: string;

  /**
   * Origin device metadata
   */
  deviceMetadata?: Metadata;

  /**
   * Origin device groups
   */
  groups: Array<{ path: string; date: number }>;

  /**
   * Device ID
   */
  _id: string;

  /**
   * Present when this measure was produced by a Measure Adapter, transforming
   * a raw sensor measure into this named/typed one.
   *
   * `measureName` above already reflects the post-adaptation name; this block
   * preserves what the sensor actually produced along with the adapter used.
   */
  adapter?: {
    /**
     * Measure Adapter document id used
     */
    _id: string;

    /**
     * Measure Adapter name
     */
    name: string;

    /**
     * Original measure name, pre-adaptation
     */
    sourceMeasureName: string;

    /**
     * Original measure type, pre-adaptation
     */
    sourceType: string;

    /**
     * Original values object, pre-adaptation
     */
    sourceValues: JSONObject;
  };
}

export interface MeasureOriginComputed extends AbstractMeasureOrigin {
  /**
   * Computed measures are not automatically added into the asset and device
   * documents at the end of the ingestion pipeline.
   */
  type: "computed";

  /**
   * Name of the measure
   */
  measureName: string;

  /**
   * String that identify the rule used to compute the measure
   */
  _id: string;
}

export interface MeasureOriginApi extends AbstractMeasureOrigin {
  type: "api";

  apiMetadata?: Metadata;

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
>
  extends Measurement<TMeasureValues>, KDocumentContent {
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

    /**
     * Present when this measurement was produced by a Measure Adapter,
     * transforming a raw sensor measure into this named/typed one.
     */
    adaptedFrom?: {
      _id: string;
      name: string;
      sourceMeasureName: string;
      sourceType: string;
      sourceValues: JSONObject;
    };
  } & Measurement<TMeasureValues>;
