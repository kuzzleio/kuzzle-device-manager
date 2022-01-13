import { Measure, MeasureDefinition } from '../types';

export interface TemperatureMeasure extends Measure {
  values: {
    temperature: number;
  }
}

export const temperatureMeasure: MeasureDefinition = {
  unit: {
    name: 'Degree',
    sign: '°',
    type: 'number',
  },
  mappings: { temperature: { type: 'float' } },
};
