import { JSONObject } from 'kuzzle';

import { ContextualMeasure } from './measures/ContextualMeasure';

export type DeviceContent = {
  /**
   * Device model
   * (This will be auto-filled by Kuzzle)
   */
  model?: string;

  /**
   * Device unique reference for a model
   */
  reference: string;

  /**
   *
   */
  measures?: ContextualMeasure[];

  /**
   * Device metadata
   */
  metadata?: JSONObject;

  /**
   * Linked asset unique identifier
   */
  assetId?: string;

  /**
   * Attached engine ID (index name)
   */
  engineId?: string;

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
