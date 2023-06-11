import { MeasureDefinition } from "lib/modules/measure";

/* eslint-disable sort-keys */

export type AccelerationMeasurement = {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  accuracy: number;
};

export const accelerationMeasureDefinition: MeasureDefinition = {
  valuesMappings: {
    acceleration: {
      properties: {
        x: { type: "float" },
        y: { type: "float" },
        z: { type: "float" },
      },
    },
    accuracy: { type: "float" },
  },
};
