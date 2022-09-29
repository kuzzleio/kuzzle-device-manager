import { MeasureDefinition } from './../types/MeasureDefinition';
import { Measurement } from './../types/MeasureContent';

/* eslint-disable sort-keys */

export type PositionMeasurement = Measurement<{
  position: {
    lat: number;
    lon: number;
  };
  altitude?: number;
  accuracy?: number;
}>;

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
