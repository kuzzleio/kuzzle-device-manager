import { BasePayloadMeasure, MeasureDefinition } from '../types';

/* eslint-disable sort-keys */

export interface TemperatureMeasurement extends BasePayloadMeasure {
  values: {
    temperature: number;
  }
}

export const temperatureMeasure: MeasureDefinition = {
  valuesMappings: { temperature: { type: 'float' } },
  unit: {
    name: 'Degree',
    sign: '°',
    type: 'number',
  },
};
