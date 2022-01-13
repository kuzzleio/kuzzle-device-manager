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
  unit: {
    name: 'GPS',
    sign: null,
    type: 'geo_point',
  },
  mappings: {
    position: { type: 'geo_point' },
    altitude: { type: 'float' },
    accuracy: { type: 'float' },
  },
};
