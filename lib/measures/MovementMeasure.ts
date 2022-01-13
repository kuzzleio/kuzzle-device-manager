import { Measure, MeasureDefinition } from '../types';

export interface MovementMeasure extends Measure {
  values: {
    movement: number;
  }
}

export const movementMeasure: MeasureDefinition = {
  unit: {
    name: 'Moving',
    sign: null,
    type: 'boolean',
  },
  mappings: { movement: { type: 'boolean' } },
};
