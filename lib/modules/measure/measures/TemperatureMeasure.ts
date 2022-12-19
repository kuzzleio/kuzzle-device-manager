import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type TemperatureMeasurement = {
  temperature: number;
};

export const temperatureMeasureDefinition: MeasureDefinition = {
  valuesMappings: { temperature: { type: "float" } },
};
