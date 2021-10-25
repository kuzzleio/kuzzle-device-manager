import { JSONObject } from 'kuzzle';

import { AssetDeviceMeasures } from './AssetDeviceMeasures';

/**
 * Asset document
 */
export interface AssetContentBase {
  type: string;

  model: string;

  reference: string;

  measures?: AssetDeviceMeasures,

  metadata?: JSONObject,
}
