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
   */
  engineId: string | null;
  /**
   * Path's of device's groups
   */
  groups: Array<{
    path: string;
    date: number;
  }>;

  /**
   * Measure adapters assigned to this device's measure slots.
   *
   * Several adapters may be assigned to the same `sourceMeasureName` at
   * once, as long as they don't produce the same `targetMeasureName` — each
   * one reads its own `sourceField` (chosen at assignment time, not baked
   * into the adapter definition) from that slot's measurement and produces
   * its own target measure. `targetMeasureName` defaults to the adapter's
   * own `targetMeasureName`, but may be overridden per-assignment so the
   * same adapter can be assigned more than once on the same device (e.g. to
   * two different slots), each producing a distinctly-named target.
   */
  measureAdapters: Array<{
    sourceMeasureName: string;
    measureAdapterId: string;
    sourceField: string;
    targetMeasureName: string;
  }>;
}

/**
 * Platform index Device document content
 */

interface DeviceProvisioningContentFields extends Pick<
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
