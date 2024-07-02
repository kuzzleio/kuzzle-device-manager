import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type MovementMeasurement = {
  movement: boolean;
};

export const movementMeasureDefinition: MeasureDefinition = {
  valuesMappings: { movement: { type: "boolean" } },
  valuesDetails: {
    movement: {
      en: {
        friendlyName: "Movement detection",
      },
      fr: {
        friendlyName: "Détection de mouvement",
      },
    },
  },
};
