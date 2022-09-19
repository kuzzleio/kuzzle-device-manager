import { Measurement, MeasureDefinition } from '../types';

/* eslint-disable sort-keys */

export type BatteryMeasurement = Measurement<{
  battery: number;
}>;

export const batteryMeasure: MeasureDefinition = {
  valuesMappings: { battery: { type: 'integer' } },
  unit: {
    name: 'Volt',
    sign: 'v',
    type: 'number',
  },
};
