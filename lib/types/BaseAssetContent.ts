import { JSONObject } from 'kuzzle';
import { KDocumentContent } from 'kuzzle-sdk';

import { MeasureContent } from './measures/MeasureContent';
import { MeasureName } from './measures/MeasureDefinition';

export interface DeviceLink {
  deviceId : string,
  measuresName?: MeasureName[];
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
