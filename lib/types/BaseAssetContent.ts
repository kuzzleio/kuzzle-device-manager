import { JSONObject } from 'kuzzle';

import { ContextualMeasure } from './measures/ContextualMeasure';

/**
 * Asset document
 */
export interface BaseAssetContent {
  type: string;

  model: string;

  reference: string;

  measures?: ContextualMeasure[],

  metadata?: JSONObject,
}
