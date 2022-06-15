import { JSONObject, KDocumentContent } from 'kuzzle';

import { MeasureContent } from './measures/MeasureContent';


export interface DeviceContent extends KDocumentContent {
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
  measures?: MeasureContent[];

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
}
