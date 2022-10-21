import { DigitalTwinContent } from "../../shared";

import { DeviceLink } from "./DeviceLink";

/**
 * Asset document content
 */
export interface AssetContent extends DigitalTwinContent {
  /**
   * Link with attached device
   */
  deviceLinks: DeviceLink[];
}

/**
 * Asset description used to contextualize each measure data point
 */
export type AssetDescription = {
  id: string;
} & Pick<AssetContent, "model" | "reference" | "metadata">;
