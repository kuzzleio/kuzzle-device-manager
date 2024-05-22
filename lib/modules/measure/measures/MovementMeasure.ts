import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type MovementMeasurement = {
  movement: boolean;
};

export const movementMeasureDefinition: MeasureDefinition = {
  valuesMappings: { movement: { type: "boolean" } },
  locales: {
    en: {
      name: "Movement detection",
      unit: "true/false",
    },
    fr: {
      name: "Détection de mouvement",
      unit: "vrai/faux",
    },
  },
};
