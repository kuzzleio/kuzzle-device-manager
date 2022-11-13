import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type MovementMeasurement = {
  movement: boolean;
};

export const movementMeasure: MeasureDefinition = {
  valuesMappings: { movement: { type: "boolean" } },
};
