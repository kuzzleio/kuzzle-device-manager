import { MeasureDefinition, Measurement } from "../types";

/* eslint-disable sort-keys */

export type TemperatureMeasurement = Measurement<{
  temperature: number;
}>;

export const temperatureMeasure: MeasureDefinition = {
  valuesMappings: { temperature: { type: "float" } },
  unit: {
    name: "Degree",
    sign: "°",
    type: "number",
  },
};
