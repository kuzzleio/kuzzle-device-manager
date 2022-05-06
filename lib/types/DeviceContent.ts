import { JSONObject } from 'kuzzle';
import { KDocumentContent } from 'kuzzle-sdk';

import { MeasureContent } from './measures/MeasureContent';
import { LinkedMeasureName } from './measures/MeasureDefinition';


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
   * correspondence table between measures types and names
   */
  measuresName: LinkedMeasureName[];

  /**
   * Attached engine ID (index name)
   */
  engineId?: string;
}
