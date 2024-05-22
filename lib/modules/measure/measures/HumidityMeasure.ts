import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type HumidityMeasurement = {
  humidity: number;
};

export const humidityMeasureDefinition: MeasureDefinition = {
  valuesMappings: { humidity: { type: "float" } },
  locales: {
    en: {
      name: "Relative humidity",
      unit: "%",
    },
    fr: {
      name: "Humidité relative",
      unit: "%",
    },
  },
};
