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
  tenantId: string;
  sensorId: string;
}

export type SensorBulkBuildedContent = {
  tenantId: string;
  sensorIds: string[];
}

export type SensorMAttachementContent = {
  errors: JSONObject[];
  successes: JSONObject[];
}

export type MAttachTenantOptions = {
  strict: boolean;
}
