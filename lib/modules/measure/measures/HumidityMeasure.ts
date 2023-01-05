import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type HumidityMeasurement = {
  humidity: number;
};

export const humidityMeasureDefinition: MeasureDefinition = {
  valuesMappings: { humidity: { type: "float" } },
};
