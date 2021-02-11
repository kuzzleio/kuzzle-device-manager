import { JSONObject } from 'kuzzle';

import { SensorMeasures } from './Measure';

export type SensorContent = {
  /**
   * Sensor unique reference for a model
   */
  reference: string;

  /**
   * Sensor measures gathered from a payload
   */
  measures: SensorMeasures;

  /**
   * Sensor model
   * (This will be auto-filled by Kuzzle)
   */
  model?: string;

  /**
   * Sensor additionnal informations gathered from a payload
   * (e.g. battery, network strength, etc.)
   */
  qos?: JSONObject;

  /**
   * Sensor metadata
   */
  metadata?: JSONObject;

  /**
   * Linked asset unique identifier
   */
  assetId?: string;

  /**
   * Attached tenant ID (index name)
   */
  tenantId?: string;

  /**
   * Document metadata
   * @todo use DocumentMetadata when it's not an interface anymore
   */
  _kuzzle_info?: {
    author?: string,
    createdAt?: number,
    updater?: string | null,
    updatedAt?: number | null
  }
}
