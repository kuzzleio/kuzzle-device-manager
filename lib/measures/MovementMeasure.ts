import { Measurement, MeasureDefinition } from '../types';

/* eslint-disable sort-keys */

export interface MovementMeasurement extends Measurement {
  values: {
    movement: boolean;
  }
}

export const movementMeasure: MeasureDefinition = {
  valuesMappings: { movement: { type: 'boolean' } },
  unit: {
    name: 'Moving',
    sign: null,
    type: 'boolean',
  },
};