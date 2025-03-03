import { MeasureModel } from "lib/modules/shared";
import { MeasureDefinition } from "../../../lib/modules/measure/types/MeasureDefinition";

/* eslint-disable sort-keys */

export type HumidityMeasurement = {
  humidity: number;
};

const humidityMeasureDefinition: MeasureDefinition = {
  valuesMappings: { humidity: { type: "float" } },
  valuesDetails: {
    humidity: {
      en: {
        friendlyName: "Relative humidity",
        unit: "%",
      },
      fr: {
        friendlyName: "Humidité relative",
        unit: "%",
      },
    },
  },
};

export const humidityMeasureModel: MeasureModel = {
  modelName: "humidity",
  definition: humidityMeasureDefinition,
};
