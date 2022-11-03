import { JSONObject } from "kuzzle-sdk";
import { DigitalTwinContent, Metadata } from "../../shared";

import { DeviceLink } from "./DeviceLink";

/**
 * Asset document content
 */
export interface AssetContent<
  TMeasurementValues extends JSONObject = JSONObject,
  TMetadata extends Metadata = Metadata
> extends DigitalTwinContent<TMeasurementValues, TMetadata> {
  /**
   * Link with attached device
   */
  deviceLinks: DeviceLink[];
}

/**
 * Asset description used to contextualize each measure data point
 */
export type AssetDescription<TMetadata extends Metadata = Metadata> = {
  id: string;
} & Pick<
  AssetContent<JSONObject, TMetadata>,
  "model" | "reference" | "metadata"
>;
