import { JSONObject, KDocumentContent } from "kuzzle";

import { FormattedMetadata } from "../../asset-category";
import { MeasureContent } from "../../measure/";

/**
 * Device document content
 */
export interface BaseDeviceContent extends KDocumentContent {
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
   * Each most recent measures with a different `deviceMeasureName`
   */
  measures?: MeasureContent[];

  /**
   * Linked asset unique identifier
   */
  assetId?: string;

  /**
   * Attached engine ID (index name)
   */
  engineId?: string;
}

export interface DeviceContent extends BaseDeviceContent {
  /**
   * Device metadata
   */
  metadata?: JSONObject;
}

export interface EsDeviceContent extends BaseDeviceContent {
  /**
   * Device metadata
   */
  metadata?: FormattedMetadata[];
}
