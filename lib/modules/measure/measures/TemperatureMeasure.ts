import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type TemperatureMeasurement = {
  temperature: number;
};

export const temperatureMeasureDefinition: MeasureDefinition = {
  valuesMappings: { temperature: { type: "float" } },
  locales: {
    en: {
      name: "Temperature",
      unit: "°C",
    },
    fr: {
      name: "Température",
      unit: "°C",
    },
  },
};
