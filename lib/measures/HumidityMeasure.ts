import { Measure, MeasureDefinition } from '../types';

export interface HumidityMeasure extends Measure {
  values: {
    humidity: number;
  }
}

export const humidityMeasure: MeasureDefinition = {
  unit: {
    name: 'Humidity',
    sign: '%',
    type: 'number',
  },
  mappings: { humidity: { type: 'float' } },
};
