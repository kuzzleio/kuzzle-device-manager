import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type MovementMeasureValues = {
  movement: boolean;
};

export const movementMeasure: MeasureDefinition = {
  valuesMappings: { movement: { type: "boolean" } },
};
