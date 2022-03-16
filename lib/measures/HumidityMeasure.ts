import { Measure, MeasureDefinition } from '../types';

export interface HumidityMeasure extends Measure {
  values: {
    humidity: number;
  }
}

export const humidityMeasure: MeasureDefinition = {
  mappings: { humidity: { type: 'float' } },
  unit: {
    name: 'Humidity',
    sign: '%',
    type: 'number',
  },
};
