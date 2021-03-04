import { JSONObject } from 'kuzzle';

import { SensorMeasures } from './Measure';

export type SensorContent = {
  reference: string;
  measures: SensorMeasures;
  /**
   * This will be auto-filled by Kuzzle
   */
  model?: string;
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

export type SensorBulkContent = {
  tenant?: string;
  id: string;
}

export type SensorBulkBuildedContent = {
  tenant: string;
  id: string[];
}

export type SensorMAttachementContent = {
  errors: JSONObject[]
  successes: JSONObject[]
}
