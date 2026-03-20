import { JSONObject, KDocumentContent } from "kuzzle-sdk";
import { DigitalTwinContent, Metadata } from "../../shared";

/**
 * Device document content
 */
export interface DeviceContent<
  TMetadata extends Metadata = any,
> extends DigitalTwinContent<TMetadata> {
  /**
   * Link with attached assets
   */
  linkedMeasures: Array<{
    /**
     * Asset ID
     */
    assetId: string;

    /**
     * Slots of the linked measures
     *
     * Array<{ asset: string, device: string, type: string }>
     *
     * @example
     *
     * [
     *   { asset: "externalTemperature", device: "temperature", }
     * ]
     */
    measureSlots: Array<{ asset: string; device: string }>;
  }>;

  /**
   * Link with attached assets for action slots (outbound commands)
   */
  linkedActions: Array<{
    /**
     * Asset ID
     */
    assetId: string;

    /**
     * Names of the linked action slots
     *
     * @example
     *
     * [
     *   { asset: "setTemperature", device: "setTemp" }
     * ]
     */
    actionSlots: Array<{ asset: string; device: string }>;
  }>;

  /**
   */
  engineId: string | null;
  /**
   * Path's of device's groups
   */
  groups: Array<{
    path: string;
    date: number;
  }>;
}

/**
 * Platform index Device document content
 */

interface DeviceProvisioningContentFields extends Pick<
  DeviceContent,
  "model" | "reference" | "engineId" | "measureSlots" | "actionSlots"
> {
  /**
   * Date of provisioning of the device on the platform
   */
  provisionedAt: number;
  /**
   * Date of last measure from the device
   */
  lastMeasuredAt: number | null;
  /**
   * An array containing the 5 last measures from the device
   */
  lastMeasures: Array<{
    measureName: string;
    values: JSONObject;
    measuredAt: number;
    type: string;
  }>;
}

export type DeviceProvisioningContent = DeviceProvisioningContentFields &
  KDocumentContent;
