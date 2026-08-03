import { KDocumentContent } from "kuzzle-sdk";

/**
 * A Measure Adapter maps a field of a registered (possibly multi-field)
 * measure type onto one field of another registered measure type.
 *
 * Bound to measure TYPES, not devices: any device producing a `sourceType`
 * measure can have this adapter assigned to a specific one of its declared
 * measure slots (see `DeviceContent.measureAdapters`). Which exact field of
 * that slot's measurement feeds the adapter (`sourceField`) is chosen at
 * assignment time (`DeviceService.setMeasureAdapter`), not baked in here —
 * this is what lets the same adapter definition (e.g. "generic raw value ->
 * humidity") be reused against different physical channels (ch1, ch2,
 * analog1, analog2, ...) instead of needing one near-duplicate adapter per
 * channel.
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
   * Default measure slot name to produce (e.g. "humidity"). May be
   * overridden per-assignment (see `DeviceContent.measureAdapters`) to allow
   * the same adapter to be assigned more than once on the same device.
   */
  targetMeasureName: string;

  /**
   * Registered measure type of the output.
   */
  targetType: string;

  /**
   * Field within `targetType`'s `valuesMappings` to write into. Supports
   * dot-notation to write into a sub-field nested inside a top-level value
   * (e.g. "envQuality.humidity"), same as `sourceField`.
   */
  targetField: string;
}
