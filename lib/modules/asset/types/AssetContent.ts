import { DigitalTwinContent, DigitalTwinMeasures, Metadata } from "../../shared";

/**
 * Asset document content
 */
export interface AssetContent<
  TMeasures extends DigitalTwinMeasures = DigitalTwinMeasures,
  TMetadata extends Metadata = Metadata
> extends DigitalTwinContent<TMeasures, TMetadata> {
  /**
   * Link with attached device
   */
  linkedDevices: Array<{
    /**
     * Device ID
     */
    id: string;

    /**
     * Names lookup table for measures
     *
     * Record<deviceName, name>
     *
     * @example
     *
     * {
     *   "temperature": "externalTemperature",
     * }
     */
    measures: Record<string, string>;
  }>;
}

/**
 * Asset description used to contextualize each measure data point
 */
export type AssetDescription<TMetadata extends Metadata = Metadata> = {
  /**
   * ID of the asset
   */
  id: string;

  /**
   * Name of the measure for the Asset
   */
  measureName: string;
} & Pick<
  AssetContent<DigitalTwinMeasures, TMetadata>,
  "model" | "reference" | "metadata"
>;
