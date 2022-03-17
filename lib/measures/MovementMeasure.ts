import { Measurement, MeasureDefinition } from '../types';

export interface MovementMeasure extends Measurement {
  values: {
    movement: number;
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
