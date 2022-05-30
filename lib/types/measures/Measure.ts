import { JSONObject } from 'kuzzle';
import { KDocumentContent } from 'kuzzle-sdk';

import { MeasureUnit } from './MeasureDefinition';
import { MeasureOrigin } from './MeasureOrigin';

export interface BaseMeasure extends KDocumentContent {
  /**
   * Type of the measure. (e.g. "temperature")
   * The type name is also the name of the sub-property to look at
   * in the "values" object to get the measure main value.
   */
  type: string;

  /**
   * Mesured values
   */
  values: JSONObject;

  /**
   * Micro Timestamp of the measure
   */
  measuredAt?: number;
}

/**
 * Represent the full content of a measure document.
 */
export interface Measure extends BaseMeasure {
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
