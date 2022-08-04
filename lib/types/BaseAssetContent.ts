import { KDocumentContent } from 'kuzzle';

import { MeasureContent } from './measures/MeasureContent';
import { FormattedMetadata } from './AssetCategoryContent';

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
  measureNamesLinks: MeasureNamesLink[];
}

/**
 * Match between a `deviceMeasureName` and an `assetMeasureName`
 */
export interface MeasureNamesLink {
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
  metadata: FormattedMetadata[],

  /**
   * Link with attached device
   */
  deviceLinks: DeviceLink[],

  category: string,
  subCategory: string,
}
