import { KDocumentContent } from "kuzzle";

import { MeasureContent } from "../../measure";

/**
 * A jointure link with a device and a match between
 * `deviceMeasureName` and generated `assetMeasureName`
 */
export interface DeviceLink {
  deviceId: string;

  /**
   * List of matches between `deviceMeasureName`
   * and `assetMeasureName`
   */
  measureNamesLinks: MeasureNamesLink[];
}

/**
 * Match between a `deviceMeasureName` and an `assetMeasureName`
 */
export interface MeasureNamesLink {
  assetMeasureName: string;
  deviceMeasureName: string;
}

export type MetadataValue = boolean | number | string | { lat: number; lon: number; };

export type Metadata = Record<string, MetadataValue>;

/**
 * Asset document content
 */
export interface AssetContent extends KDocumentContent {
  /**
   * Asset model name
   */
  model: string;

  /**
   * Asset unique reference
   */
  reference: string;

  /**
   * Asset metadata
   */
  metadata: Metadata;

  /**
   * Each most recent measures attached to the asset
   * with a different `deviceMeasureName`
   */
  measures: MeasureContent[];

  /**
   * Link with attached device
   */
  deviceLinks: DeviceLink[];
}
