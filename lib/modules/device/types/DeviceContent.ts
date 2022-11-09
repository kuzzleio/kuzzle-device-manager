import { DigitalTwinContent, DigitalTwinMeasures, Metadata } from "../../shared";

/**
 * Device document content
 */
export interface DeviceContent<
  TMeasures extends DigitalTwinMeasures = DigitalTwinMeasures,
  TMetadata extends Metadata = Metadata
> extends DigitalTwinContent<TMeasures, TMetadata> {
  /**
   * Linked asset unique identifier
   */
  assetId?: string;

  /**
   */
  engineId?: string;
}
