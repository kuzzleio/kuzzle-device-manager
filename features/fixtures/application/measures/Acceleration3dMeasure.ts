/* eslint-disable sort-keys */

import {
  MeasureDefinition,
  Measurement,
} from "../../../../lib/modules/measure";

export type Acceleration3dMeasurement = Measurement<{
  x: number;
  y: number;
  z: number;
}>;

export const acceleration3dMeasure: MeasureDefinition = {
  valuesMappings: {
    x: { type: "float" },
    y: { type: "float" },
    z: { type: "float" },
  },
  unit: {
    name: "Acceleration",
    sign: "m/s^2",
    type: "number",
  },
};
