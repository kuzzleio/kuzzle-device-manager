import { JSONObject, KDocumentContent } from 'kuzzle';

import { MeasureContent } from './measures/MeasureContent';
import { LinkedMeasureName } from './measures/MeasureDefinition';

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

  deviceLinks: DeviceLink[]
}
