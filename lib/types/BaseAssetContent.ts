import { JSONObject, KDocumentContent } from 'kuzzle';

import { MeasureContent } from './measures/MeasureContent';

/**
 * A jointure link with a device and a match between
 * `deviceMeasureName` and generated `assetMeasureName`
 */
export interface DeviceLink {
  deviceId : string,

  /**
   * List of matches between `deviceMeasureName`
   * and `assetMeasureName`
   */
  measureNamesLinks: MeasureNameLink[];
}

/**
 * Match between a `deviceMeasureName` and an `assetMeasureName`
 */
export interface MeasureNameLink {
  assetMeasureName: string;
  deviceMeasureName: string;
}

/**
 * Asset document content
 */
export interface BaseAssetContent extends KDocumentContent {
  type: string;

  model: string;

  reference: string;

  /**
   * Each most recent measures attached to the asset
   * with a different `deviceMeasureName`
   */
  measures: MeasureContent[],

  /**
   * Asset metadata
   */
  metadata?: JSONObject,

  /**
   * Link with attached device
   */
  deviceLinks: DeviceLink[]
}
