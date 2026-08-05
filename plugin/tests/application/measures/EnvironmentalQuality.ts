import { MeasureModel } from "lib/modules/shared";
import { MeasureDefinition } from "../../../lib/modules/measure/types/MeasureDefinition";

/* eslint-disable sort-keys */

export type EnvironmentalQualityMeasurement = {
  envQuality: {
    humidity: number;
    co2: number;
  };
};

const environmentalQualityMeasureDefinition: MeasureDefinition = {
  scope: "asset",
  valuesMappings: {
    envQuality: {
      properties: {
        humidity: { type: "float" },
        co2: { type: "integer" },
      },
    },
  },
};

export const environmentalQualityMeasureModel: MeasureModel = {
  modelName: "environmentalQuality",
  definition: environmentalQualityMeasureDefinition,
};
