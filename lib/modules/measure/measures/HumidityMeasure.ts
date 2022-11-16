import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type HumidityMeasurement = {
  humidity: number;
};

export const humidityMeasure: MeasureDefinition = {
  valuesMappings: { humidity: { type: "float" } },
};
