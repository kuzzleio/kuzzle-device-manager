import { JSONObject, KDocumentContent } from 'kuzzle';

import { Measure } from './measures/Measure';
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

  measures?: Measure[],

  metadata?: JSONObject,

  deviceLinks: DeviceLink[]
}
