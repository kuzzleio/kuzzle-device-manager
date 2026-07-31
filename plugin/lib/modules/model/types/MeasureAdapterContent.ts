import { KDocumentContent } from "kuzzle-sdk";

/**
 * A Measure Adapter maps one field of a registered (possibly multi-field)
 * measure type onto one field of another registered measure type.
 *
 * Bound to measure TYPES, not devices: any device producing a `sourceType`
 * measure can have this adapter assigned to a specific one of its declared
 * measure slots (see `DeviceContent.measureAdapters`).
 */
export interface MeasureAdapterContent extends KDocumentContent {
  /**
   * Unique name identifying this adapter (used to compute its document id).
   */
  name: string;

  /**
   * Registered measure type of the input.
   */
  sourceType: string;

  /**
   * Field key within `sourceType`'s `valuesMappings` to read from.
   */
  sourceField: string;

  /**
   * Measure slot name to produce (e.g. "humidity").
   */
  targetMeasureName: string;

  /**
   * Registered measure type of the output.
   */
  targetType: string;

  /**
   * Field key within `targetType`'s `valuesMappings` to write into.
   */
  targetField: string;
}
