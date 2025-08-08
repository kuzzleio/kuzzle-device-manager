import { JSONObject, KDocumentContent } from "kuzzle-sdk";
import { DigitalTwinContent, Metadata } from "../../shared";

/**
 * Device document content
 */
export interface DeviceContent<TMetadata extends Metadata = any>
  extends DigitalTwinContent<TMetadata> {
  /**
   * Link with attached devices
   */
  linkedAssets: Array<{
    /**
     * Asset ID
     */
    _id: string;

    /**
     * Names of the linked measures
     *
     * Array<{ asset: string, device: string, type: string }>
     *
     * @example
     *
     * [
     *   { asset: "externalTemperature", device: "temperature", type: "temperature" }
     * ]
     */
    measureNames: Array<{ asset: string; device: string; type: string }>;
  }>;

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
  /**
   * Date of association of the device on the engine
   */
  associatedAt: number;
}

/**
 * Platform index Device document content
 */

interface DeviceProvisioningContentFields
  extends Pick<
    DeviceContent,
    "model" | "reference" | "engineId" | "measureSlots"
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
