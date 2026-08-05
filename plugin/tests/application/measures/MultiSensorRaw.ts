import { MeasureModel } from "lib/modules/shared";
import { MeasureDefinition } from "../../../lib/modules/measure/types/MeasureDefinition";

/* eslint-disable sort-keys */

export type MultiSensorRawMeasurement = {
  readings: {
    ch1: number;
    ch2: number;
  };
};

const multiSensorRawMeasureDefinition: MeasureDefinition = {
  scope: "device",
  valuesMappings: {
    readings: {
      properties: {
        ch1: { type: "float" },
        ch2: { type: "float" },
      },
    },
  },
};

export const multiSensorRawMeasureModel: MeasureModel = {
  modelName: "multiSensorRaw",
  definition: multiSensorRawMeasureDefinition,
};
