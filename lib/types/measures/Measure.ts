import { JSONObject } from 'kuzzle';
import { KDocumentContent } from 'kuzzle-sdk';

import { MeasureUnit } from './MeasureDefinition';
import { MeasureOrigin } from './MeasureOrigin';

/**
 * Represents a measurement of a value to post on an asset
 */
export interface BaseAssetMeasure extends KDocumentContent {
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
export interface BasePayloadMeasure {
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
export interface MetaMeasure {
  /**
   * A device may have different measures for the same type (e.g. measure temperature 2 times)
   * Should be set when you link the device to the asset
   */
  name?: string;

  /**
   * Measurement self-description
   */
  unit: MeasureUnit;

  /**
   * Micro Timestamp of the measure
   */
  measuredAt: number;

  /**
   * Origin of the measure
   */
  origin: MeasureOrigin;
}

/**
 * Represent the full content of a measure document.
 */
export type Measure = BaseAssetMeasure & MetaMeasure & BasePayloadMeasure;
