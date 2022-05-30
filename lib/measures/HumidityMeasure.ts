import { BasePayloadMeasure, MeasureDefinition } from '../types';

/* eslint-disable sort-keys */

export interface HumidityMeasurement extends BasePayloadMeasure {
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
