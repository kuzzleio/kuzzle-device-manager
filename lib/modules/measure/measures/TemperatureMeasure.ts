import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type TemperatureMeasurement = {
  temperature: number;
};

export const temperatureMeasureDefinition: MeasureDefinition = {
  valuesMappings: { temperature: { type: "float" } },
  valuesDetails: {
    temperature: {
      en: {
        friendlyName: "Temperature",
        unit: "°C",
      },
      fr: {
        friendlyName: "Température",
        unit: "°C",
      },
    },
  },
};
