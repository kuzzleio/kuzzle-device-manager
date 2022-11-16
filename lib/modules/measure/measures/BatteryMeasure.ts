import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type BatteryMeasurement = {
  battery: number;
};

export const batteryMeasure: MeasureDefinition = {
  valuesMappings: { battery: { type: "integer" } },
};
