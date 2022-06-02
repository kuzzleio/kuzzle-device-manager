import { JSONObject } from 'kuzzle';
import { KDocumentContent } from 'kuzzle-sdk';

import { MeasureContent } from './measures/MeasureContent';
import { LinkedMeasureName } from './measures/MeasureDefinition';
import { AssetCategoryContent } from './AssetCategoryContent';

export interface DeviceLink {
  deviceId : string,
  measuresName: LinkedMeasureName[];
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

  deviceLinks: DeviceLink[],

  category: AssetCategoryContent,
  subCategory: AssetCategoryContent,


}
