import { BadRequestError } from "kuzzle";
import { JSONObject } from "kuzzle-sdk";

import { DecodedMeasurement } from "../measure";

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
  private measurementsByDevice: Record<string, DecodedMeasurement[]> = {};

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
  addMeasurement<TMeasureValues extends JSONObject = JSONObject>(
    deviceReference: string,
    measureName: TDecoder["measures"][number]["name"],
    measurement: Omit<DecodedMeasurement<TMeasureValues>, "measureName">,
  ) {
    if (!this.decoder.measureNames.includes(measureName)) {
      throw new BadRequestError(
        `Decoder "${this.decoder.deviceModel}" has no measure named "${measureName}"`,
      );
    }

    this.validateMeasurement(measurement);

    if (!this.measurementsByDevice[deviceReference]) {
      this.measurementsByDevice[deviceReference] = [];
    }

    const decodedMeasurement: DecodedMeasurement<TMeasureValues> = {
      measureName,
      ...measurement,
    };

    this.measurementsByDevice[deviceReference].push(decodedMeasurement);
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
  getMeasurements(deviceReference: string): DecodedMeasurement[] {
    return this.measurementsByDevice[deviceReference];
  }

  /**
   * Get the metadata for a device
   */
  getMetadata(deviceReference: string): JSONObject {
    return this.metadataByDevice[deviceReference] ?? {};
  }

  private validateMeasurement<TMeasureValues>(
    measurement: Omit<DecodedMeasurement<TMeasureValues>, "measureName">,
  ) {
    if (measurement.measuredAt.toString().length !== 13) {
      throw new BadRequestError(
        `Invalid payload: "measuredAt" should be a timestamp in milliseconds`,
      );
    }
  }
}
