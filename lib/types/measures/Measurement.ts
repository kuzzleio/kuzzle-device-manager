import { JSONObject } from 'kuzzle';

/**
 * Represents a measurement of a value
 *
 * This interface should be extended and the `values` property specialized
 * to declare new measurement type.
 */
export interface Measurement {
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
