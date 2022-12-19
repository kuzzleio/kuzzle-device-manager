import { MeasureDefinition } from "./../types/MeasureDefinition";

/* eslint-disable sort-keys */

export type PositionMeasurement = {
  position: {
    lat: number;
    lon: number;
  };
  altitude?: number;
  accuracy?: number;
};

export const positionMeasureDefinition: MeasureDefinition = {
  valuesMappings: {
    accuracy: { type: "float" },
    altitude: { type: "float" },
    position: { type: "geo_point" },
  },
};
