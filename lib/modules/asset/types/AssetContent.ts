import { JSONObject } from "kuzzle";

import { DigitalTwinContent, Metadata } from "../../shared";

/**
 * Asset document content
 */
export interface AssetContent<
  TMeasures extends JSONObject = any,
  TMetadata extends Metadata = any
> extends DigitalTwinContent<TMeasures, TMetadata> {
  /**
   * Link with attached device
   */
  linkedDevices: Array<{
    /**
     * Device ID
     */
    _id: string;

    /**
     * Names lookup table for measures
     *
     * Record<deviceName, assetName>
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
  AssetContent<JSONObject, TMetadata>,
  "model" | "reference" | "metadata"
>;
