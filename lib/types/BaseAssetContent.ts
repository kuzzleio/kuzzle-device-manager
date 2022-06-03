import { JSONObject, KDocumentContent } from 'kuzzle';

import { MeasureContent } from './measures/MeasureContent';
import { MeasureNameLink } from './measures/MeasureDefinition';

export interface DeviceLink {
  deviceId : string,

  /**
   * List of measures names when linked to the asset.
   * Default measure name is measure type.
   */
  measuresNameLinks: MeasureNameLink[];
}

/**
 * Asset document
 */
export interface BaseAssetContent extends KDocumentContent {
  type: string;

  model: string;

  reference: string;

  measures?: MeasureContent[],

  metadata?: JSONObject,

  deviceLinks: DeviceLink[]
}
