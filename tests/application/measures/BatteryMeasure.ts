import { MeasureModel } from "lib/modules/shared";
import { MeasureDefinition } from "../../../lib/modules/measure/types/MeasureDefinition";

/* eslint-disable sort-keys */

export type BatteryMeasurement = {
  battery: number;
};

const batteryMeasureDefinition: MeasureDefinition = {
  valuesMappings: { battery: { type: "integer" } },

  valuesDetails: {
    battery: {
      en: {
        friendlyName: "Battery level",
        unit: "%",
      },
      fr: {
        friendlyName: "Niveau de batterie",
        unit: "%",
      },
    },
  },
};

export const batteryMeasureModel: MeasureModel = {
  modelName: "battery",
  definition: batteryMeasureDefinition,
};
