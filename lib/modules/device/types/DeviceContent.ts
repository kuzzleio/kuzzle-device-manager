import { DigitalTwinContent } from "../../shared";

/**
 * Device document content
 */
export interface DeviceContent extends DigitalTwinContent {
  /**
   * Linked asset unique identifier
   */
  assetId?: string;

  /**
   */
  engineId?: string;
}
