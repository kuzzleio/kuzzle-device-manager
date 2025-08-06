import { DigitalTwinContent, Metadata } from "../../shared";

/**
 * Device document content
 */
export interface DeviceContent<TMetadata extends Metadata = any>
  extends DigitalTwinContent<TMetadata> {
  /**
   * Linked asset unique identifier
   */
  assetId: string | null;

  /**
   */
  engineId: string;
  /**
   * Path's of device's groups
   */
  groups: Array<{
    path: string;
    date: number;
  }>;
}

/**
 * Admin index Device document content
 */
export interface AdminDeviceContent
  extends Omit<DeviceContent, "metadata" | "groups"> {}
