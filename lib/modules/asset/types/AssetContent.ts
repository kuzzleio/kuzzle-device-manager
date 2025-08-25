import { DigitalTwinContent, Metadata } from "../../shared";

/**
 * Asset document content
 */
export interface AssetContent<TMetadata extends Metadata = any>
  extends DigitalTwinContent<TMetadata> {
  /**
   * Link with attached devices
   */
  linkedMeasures: Array<{
    /**
     * Device ID
     */
    deviceId: string;

    /**
     * Names of the linked measures
     *
     * Array<{ asset: string, device: string, type: string }>
     *
     * @example
     *
     * [
     *   { asset: "externalTemperature", device: "temperature" }
     * ]
     */
    measureSlots: Array<{ asset: string; device: string }>;
  }>;
  /**
   * Path's of asset groups
   */
  groups: Array<{
    path: string;
    date: number;
  }>;
}

/**
 * Asset description used to contextualize each measure data point
 */
export type AssetMeasureContext<TMetadata extends Metadata = Metadata> = {
  /**
   * ID of the asset
   */
  _id: string;

  /**
   * Name of the measure for the Asset
   */
  measureName: string;
} & Pick<
  AssetContent<TMetadata>,
  "model" | "reference" | "metadata" | "groups"
>;
