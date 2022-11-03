import { DigitalTwinContent, Metadata } from "../../shared";

/**
 * Device document content
 */
export interface DeviceContent<TMetadata extends Metadata = Metadata>
  extends DigitalTwinContent<TMetadata> {
  /**
   * Linked asset unique identifier
   */
  assetId?: string;

  /**
   */
  engineId?: string;
}
