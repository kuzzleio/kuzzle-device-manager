import { KDocumentContent } from "kuzzle";

import { Metadata } from "../../asset";
import { MeasureContent } from "../../measure/";

/**
 * Device document content
 */
export interface DeviceContent extends KDocumentContent {
  /**
   * Device model
   */
  model: string;

  /**
   * Device unique reference for a model
   */
  reference: string;

  /**
   * Device metadata
   */
  metadata: Metadata;

  /**
   * Each most recent measures with a different `deviceMeasureName`
   */
  measures: MeasureContent[];

  /**
   * Linked asset unique identifier
   */
  assetId?: string;

  /**
   * Attached engine ID (index name)
   */
  engineId?: string;
}
