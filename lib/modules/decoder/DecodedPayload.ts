import { PluginImplementationError, JSONObject } from "kuzzle";

import { Measurement } from "../measure";

import { Decoder } from "./Decoder";

/**
 * Class containing the decoded measures.
 */
export class DecodedPayload<TDecoder extends Decoder = Decoder> {
  public decoder: TDecoder;

  /**
   * Measurements per device.
   *
   * Record<deviceReference, Measurement[]>
   */
  private measurementsByDevice: Record<string, Measurement[]> = {};

  /**
   * Metadata per device.
   */
  private metadataByDevice: JSONObject = {};

  constructor(decoder: TDecoder) {
    this.decoder = decoder;
  }

  get references() {
    return Object.keys(this.measurementsByDevice);
  }

  /**
   * Add a new measure into the decoded payload
   *
   * @param deviceReference Device reference
   * @param measureName Name of the decoded measure
   * @param measurement Measurement object
   */
  addMeasurement<TMeasurement extends Measurement = Measurement>(
    deviceReference: string,
    measureName: TDecoder["measures"][number]["name"],
    measurement: TMeasurement
  ) {
    if (!this.decoder.measureNames.includes(measureName)) {
      throw new PluginImplementationError(
        `Decoder "${this.decoder.deviceModel}" has no measure named "${measureName}"`
      );
    }

    if (!this.measurementsByDevice[deviceReference]) {
      this.measurementsByDevice[deviceReference] = [];
    }

    measurement.deviceMeasureName = measureName;

    this.measurementsByDevice[deviceReference].push(measurement);
  }

  /**
   * Add metadata values for a Device.
   *
   * Metadata should have been declared on the plugin to be used.
   *
   * @param deviceReference Device reference
   * @param metadata Object containing metadata values
   */
  addMetadata(deviceReference: string, metadata: JSONObject) {
    if (!this.metadataByDevice[deviceReference]) {
      this.metadataByDevice[deviceReference] = {};
    }

    this.metadataByDevice[deviceReference] = {
      ...this.metadataByDevice[deviceReference],
      ...metadata,
    };
  }

  /**
   * Gets the measurements decoded for a device
   */
  getMeasurements(deviceReference: string): Measurement[] {
    return this.measurementsByDevice[deviceReference];
  }

  /**
   * Get the metadata for a device
   */
  getMetadata(deviceReference: string): JSONObject {
    return this.metadataByDevice[deviceReference];
  }
}
