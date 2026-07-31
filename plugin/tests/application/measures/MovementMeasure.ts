import { MeasureModel } from "lib/modules/shared";
import { MeasureDefinition } from "../../../lib/modules/measure/types/MeasureDefinition";

/* eslint-disable sort-keys */

export type MovementMeasurement = {
  movement: boolean;
};

const movementMeasureDefinition: MeasureDefinition = {
  scope: "asset",
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

export const movementMeasureModel: MeasureModel = {
  modelName: "movement",
  definition: movementMeasureDefinition,
};
