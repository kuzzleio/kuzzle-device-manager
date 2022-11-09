import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type TemperatureMeasureValues = {
  temperature: number;
};

export const temperatureMeasure: MeasureDefinition = {
  valuesMappings: { temperature: { type: "float" } },
};
