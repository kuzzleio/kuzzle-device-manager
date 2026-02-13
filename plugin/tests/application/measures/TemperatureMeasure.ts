import { MeasureModel } from "lib/modules/shared";
import { MeasureDefinition } from "../../../lib/modules/measure/types/MeasureDefinition";

/* eslint-disable sort-keys */

export type TemperatureMeasurement = {
  temperature: number;
};

const temperatureMeasureDefinition: MeasureDefinition = {
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

export const temperatureMeasureModel: MeasureModel = {
  modelName: "temperature",
  definition: temperatureMeasureDefinition,
};
