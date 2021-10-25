import { BaseMeasure } from './BaseMeasure';

/**
 * Represents a temperature measure
 */
export interface TemperatureMeasure extends BaseMeasure {
  /**
   * Temperature in celcius degree (decimal)
   *
   * @example
   * 23.4
   */
  degree: number;
}

export interface DeviceTemperatureMeasures {
  temperature?: TemperatureMeasure
}

export const temperatureMeasureMappings = {
  // temperature
  degree: { type: 'float' },
};
