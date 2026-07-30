import { KDocumentContent } from "kuzzle-sdk";

/**
 * A single field mapping of a Measure Adapter: renames/retypes a measure
 * produced by a device's decoder into a use-case specific named measure.
 *
 * v1 only supports 1:1 renaming: the raw value is copied as-is into the
 * target measure's (single) value field.
 */
export interface MeasureAdapterMapping {
  /**
   * Raw measure name as declared in the decoder's `measures` property.
   */
  sourceMeasureName: string;

  /**
   * New, use-case specific measure name.
   *
   * @example "temp"
   */
  targetMeasureName: string;

  /**
   * Registered measure type the measure should be filed under.
   *
   * @example "temperature"
   */
  targetType: string;
}

/**
 * Measure Adapter document content.
 *
 * Maps a device's raw/generic decoded measures onto typed, use-case specific
 * measure names, without requiring a new decoder.
 */
export interface MeasureAdapterContent extends KDocumentContent {
  /**
   * Human readable label.
   */
  name: string;

  /**
   * Device model this adapter applies to.
   *
   * Must match the `deviceModel` of a registered Decoder.
   */
  source: string;

  /**
   * Field mappings applied on the decoded measures of devices using this
   * adapter. Measures not covered by the mapping pass through unchanged.
   */
  mapping: MeasureAdapterMapping[];
}
