import { Measurement, MeasureDefinition } from "../types";

/* eslint-disable sort-keys */

export interface PositionMeasurement extends Measurement {
  values: {
    position: {
      lat: number;
      lon: number;
    };
    altitude?: number;
    accuracy?: number;
  };
}

export const positionMeasure: MeasureDefinition = {
  valuesMappings: {
    accuracy: { type: "float" },
    altitude: { type: "float" },
    position: { type: "geo_point" },
  },
  unit: {
    name: "GPS",
    sign: null,
    type: "geo_point",
  },
};
