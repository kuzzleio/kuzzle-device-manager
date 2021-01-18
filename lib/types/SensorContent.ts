import { JSONObject } from 'kuzzle';

import { SensorMeasures } from './Measure';

export type SensorContent = {
  reference: string;
  model: string;
  measures: SensorMeasures;
  qos?: JSONObject;
  metadata?: JSONObject;
  assetId?: string;
  tenantId?: string;

  _kuzzle_info?: {
    author?: string,
    createdAt?: number,
    updater?: string | null,
    updatedAt?: number | null
  }
}