import { BasePayloadMeasure, MeasureDefinition } from '../types';

/* eslint-disable sort-keys */

export interface BatteryMeasurement extends BasePayloadMeasure {
  values: {
    battery: number;
  }
}

export const batteryMeasure: MeasureDefinition = {
  valuesMappings: { battery: { type: 'integer' } },
  unit: {
    name: 'Volt',
    sign: 'v',
    type: 'number',
  },
};
