import { JSONObject } from "kuzzle-sdk";

import { DigitalTwinContent, Metadata } from "../../shared";

/**
 * Device document content
 */
export interface DeviceContent<
  TMeasures extends JSONObject = any,
  TMetadata extends Metadata = any
> extends DigitalTwinContent<TMeasures, TMetadata> {
  /**
   * Linked asset unique identifier
   */
  assetId: string | null;

  /**
   */
  engineId: string;
}
