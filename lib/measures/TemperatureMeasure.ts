import { Measure, MeasureDefinition } from '../types';

export interface TemperatureMeasure extends Measure {
  values: {
    temperature: number;
  }
}

export const temperatureMeasure: MeasureDefinition = {
  mappings: { temperature: { type: 'float' } },
  unit: {
    name: 'Degree',
    sign: '°',
    type: 'number',
  },
};
