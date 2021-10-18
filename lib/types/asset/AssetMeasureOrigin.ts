import { JSONObject } from 'kuzzle';

export interface AssetMeasureOrigin {
  /**
   * Device ID
   */
  id: string;

  /**
   * Device model
   */
  model: string;

  /**
   * Device reference
   */
  reference: string;

  /**
   * Device metadata
   */
  metadata?: JSONObject;

  /**
   * Device Quality of Service informations
   */
  qos?: JSONObject;
}
