import { Measure, MeasureDefinition } from '../types';

export interface PositionMeasure extends Measure {
  values: {
    position: {
      lat: number;
      lon: number;
    };
    altitude?: number;
    accuracy?: number;
  }
}

export const positionMeasure: MeasureDefinition = {
  mappings: {
    accuracy: { type: 'float' },
    altitude: { type: 'float' },
    position: { type: 'geo_point' },
  },
  unit: {
    name: 'GPS',
    sign: null,
    type: 'geo_point',
  },
};
