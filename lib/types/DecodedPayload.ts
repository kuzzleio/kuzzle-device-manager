import { Measurement } from './measures/MeasureContent';

/**
 * Class containing the decoded measures.
 */
export class DecodedPayload {
  /**
   * Measurements per device.
   *
   * Record<deviceReference, Measurement[]>
   */
  private measurementsByDevice: Record<string, Measurement[]> = {};

  get references () {
    return Object.keys(this.measurementsByDevice);
  }

  /**
   * Add a new measure into the decoded payload
   *
   * @param deviceReference Device reference
   * @param measurement Measurement object
   */
  addMeasurement<TMeasurement extends Measurement = Measurement> (
    deviceReference: string,
    measurement: TMeasurement,
  ) {
    if (! this.measurementsByDevice[deviceReference]) {
      this.measurementsByDevice[deviceReference] = [];
    }

    this.measurementsByDevice[deviceReference].push(measurement);
  }

  /**
   * Gets the measurements decoded for a device
   */
  getMeasurements (deviceReference: string): Measurement[] {
    return this.measurementsByDevice[deviceReference];
  }
}
