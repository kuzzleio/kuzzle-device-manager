import { JSONObject, KDocumentContent } from 'kuzzle';

import { Measure } from './measures/Measure';
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
  measures?: Measure[];

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
