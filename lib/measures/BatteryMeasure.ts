import { Measure, MeasureDefinition } from '../types';

export interface BatteryMeasure extends Measure {
  values: {
    battery: number;
  }
}

export const batteryMeasure: MeasureDefinition = {
  mappings: { battery: { type: 'integer' } },
  unit: {
    name: 'Volt',
    sign: 'v',
    type: 'number',
  },
};
