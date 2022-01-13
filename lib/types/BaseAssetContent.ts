import { JSONObject } from 'kuzzle';

import { ContextualizedMeasure } from './measures/ContextualizedMeasure';

/**
 * Asset document
 */
export interface BaseAssetContent {
  type: string;

  model: string;

  reference: string;

  measures?: ContextualizedMeasure[],

  metadata?: JSONObject,
}
