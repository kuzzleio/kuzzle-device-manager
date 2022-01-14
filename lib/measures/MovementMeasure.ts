import { Measure, MeasureDefinition } from '../types';

export interface MovementMeasure extends Measure {
  values: {
    movement: number;
  }
}

export const movementMeasure: MeasureDefinition = {
  mappings: { movement: { type: 'boolean' } },
  unit: {
    name: 'Moving',
    sign: null,
    type: 'boolean',
  },
};
