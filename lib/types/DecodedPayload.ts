import { Measurement } from './measures/MeasureContent';

/**
 * Record containing decoded measurements for each device.
 *
 * Record<deviceReference, Measurement[]>
 *
 * @example
 * const decodedPayload: DecodedPayload = {
 *   devices: {
 *     'BZH42AZF': [
 *       {
 *         deviceMeasureName: 'battery',
 *         measuredAt: 1655379939496,
 *         type: 'battery',
 *         values: { battery: 32 },
 *       },
 *     ],
 *     'IS7L8HK': [
 *       {
 *         deviceMeasureName: 'internal_temperature',
 *         measuredAt: 1655379939496,
 *         type: 'temperature',
 *         values: { temperature: -3 },
 *       },
 *       {
 *         deviceMeasureName: 'external_temperature',
 *         measuredAt: 1655379939496,
 *         type: 'temperature',
 *         values: { temperature: 39 },
 *       },
 *     ],
 *   }
 * };
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

  addMeasurement<TMeasurement extends Measurement = Measurement> (
    deviceReference: string,
    measurement: TMeasurement,
  ) {
    if (! this.measurementsByDevice[deviceReference]) {
      this.measurementsByDevice[deviceReference] = [];
    }

    this.measurementsByDevice[deviceReference].push(measurement);
  }

  getMeasurements (deviceReference: string): Measurement[] {
    return this.measurementsByDevice[deviceReference];
  }
}
