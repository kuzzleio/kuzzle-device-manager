import { JSONObject } from 'kuzzle';
import { KDocumentContent } from 'kuzzle-sdk';

import { MeasureContent } from './measures/MeasureContent';

/**
 * Asset document
 */
export interface BaseAssetContent extends KDocumentContent {
  type: string;

  model: string;

  reference: string;

  measures?: MeasureContent[],

  metadata?: JSONObject,

  deviceIds?: string[]
}
