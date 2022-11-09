import { JSONObject } from "kuzzle";

export type EmbeddedMeasure<TMeasureValue extends JSONObject = JSONObject> = {
  /**
   * Measure unique identifier
   */
  _id: string;

  /**
   * Measure type
   */
  type: string;

  /**
   * Measure date
   */
  measuredAt: number;

  /**
   * An object containing the measure values.
   */
  values: TMeasureValue;
}
