import { MeasureDefinition } from "./../types/MeasureDefinition";
import { Measurement } from "./../types/MeasureContent";

/* eslint-disable sort-keys */

export type HumidityMeasurement = Measurement<{
  humidity: number;
}>;

export const humidityMeasure: MeasureDefinition = {
  valuesMappings: { humidity: { type: "float" } },
  unit: {
    name: "Humidity",
    sign: "%",
    type: "number",
  },
};
