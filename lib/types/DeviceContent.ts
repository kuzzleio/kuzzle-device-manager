import { JSONObject } from 'kuzzle';

import { DeviceMeasures } from './Measure';

export type DeviceContent = {
  /**
   * Device unique reference for a model
   */
  reference: string;

  /**
   * Device measures gathered from a payload
   */
  measures?: DeviceMeasures;

  /**
   * Device model
   * (This will be auto-filled by Kuzzle)
   */
  model?: string;

  /**
   * Device additionnal informations gathered from a payload
   * (e.g. battery, network strength, etc.)
   */
  qos?: JSONObject;

  /**
   * Device metadata
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

export type DeviceBulkContent = {
  tenantId?: string;
  deviceId: string;
}

export type DeviceBulkBuildedContent = {
  tenantId: string;
  deviceIds: string[];
}

export type DeviceMAttachementContent = {
  errors: JSONObject[];
  successes: JSONObject[];
}

export type DeviceMRequestContent = {
  _id: string;
  body: JSONObject;
}
