import { JSONObject } from "kuzzle-sdk";
import { DigitalTwinContent, Metadata } from "../../shared";

/**
 * Device document content
 */
export interface DeviceContent<
  TMeasurementValues extends JSONObject = JSONObject,
  TMetadata extends Metadata = Metadata
> extends DigitalTwinContent<TMeasurementValues, TMetadata> {
  /**
   * Linked asset unique identifier
   */
  assetId?: string;

  /**
   */
  engineId?: string;
}
