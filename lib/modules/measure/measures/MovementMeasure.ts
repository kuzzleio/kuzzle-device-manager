import { MeasureDefinition } from "./../types/MeasureDefinition";
import { Measurement } from "./../types/MeasureContent";

/* eslint-disable sort-keys */

export type MovementMeasurement = Measurement<{
  movement: boolean;
}>;

export const movementMeasure: MeasureDefinition = {
  valuesMappings: { movement: { type: "boolean" } },
  unit: {
    name: "Moving",
    sign: null,
    type: "boolean",
  },
};
