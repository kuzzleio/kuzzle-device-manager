import { PluginImplementationError } from 'kuzzle';
import { Decoder } from '../core-classes/Decoder';
import { Measurement } from './measures/MeasureContent';

/**
 * Class containing the decoded measures.
 */
export class DecodedPayload {
  private decoder: Decoder;

  /**
   * Measurements per device.
   *
   * Record<deviceReference, Measurement[]>
   */
  private measurementsByDevice: Record<string, Measurement[]> = {};

  constructor (decoder: Decoder) {
    this.decoder = decoder;
  }

  get references () {
    return Object.keys(this.measurementsByDevice);
  }

  /**
   * Add a new measure into the decoded payload
   *
   * @param deviceReference Device reference
   * @param measureName Name of the decoded measure
   * @param measurement Measurement object
   */
  addMeasurement<TMeasurement extends Measurement = Measurement> (
    deviceReference: string,
    measureName: string,
    measurement: TMeasurement,
  ) {
    if (! this.decoder.measureNames.includes(measureName)) {
      throw new PluginImplementationError(`Decoder "${this.decoder.deviceModel}" has no measure named "${measureName}"`);
    }

    if (! this.measurementsByDevice[deviceReference]) {
      this.measurementsByDevice[deviceReference] = [];
    }

    measurement.deviceMeasureName = measureName;

    this.measurementsByDevice[deviceReference].push(measurement);
  }

  /**
   * Gets the measurements decoded for a device
   */
  getMeasurements (deviceReference: string): Measurement[] {
    return this.measurementsByDevice[deviceReference];
  }
}
