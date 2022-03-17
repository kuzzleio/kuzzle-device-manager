import { Measurement, MeasureDefinition } from '../types';

export interface HumidityMeasurement extends Measurement {
  values: {
    humidity: number;
  }
}

export const humidityMeasure: MeasureDefinition = {
  valuesMappings: { humidity: { type: 'float' } },
  unit: {
    name: 'Humidity',
    sign: '%',
    type: 'number',
  },
};
