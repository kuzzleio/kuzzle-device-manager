import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type BatteryMeasurement = {
  battery: number;
};

export const batteryMeasureDefinition: MeasureDefinition = {
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
