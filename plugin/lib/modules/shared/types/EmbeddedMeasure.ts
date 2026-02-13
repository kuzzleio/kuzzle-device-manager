import { JSONObject } from "kuzzle-sdk";

export type EmbeddedMeasure<TMeasureValue extends JSONObject = JSONObject> = {
  /**
   * Payloads that created this measure.
   * This can be used to retrieve the measure in the measures collection
   */
  payloadUuids: string[];

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

  /**
   * Name of the measure for the digital twin
   */
  name: string;

  /**
   * Origin ID of the measure (deviceId in most cases)
   */
  originId: string;
};
