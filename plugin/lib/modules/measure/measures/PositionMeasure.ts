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
    position: { type: "geo_point" },
    accuracy: { type: "float" },
    altitude: { type: "float" },
  },
  valuesDetails: {
    position: {
      en: {
        friendlyName: "Localization",
        unit: "(lat,lon)",
      },
      fr: {
        friendlyName: "Localisation",
        unit: "(lat,lon)",
      },
    },
    altitude: {
      en: {
        friendlyName: "Altitude",
        unit: "m",
      },
      fr: {
        friendlyName: "Altitude",
        unit: "m",
      },
    },
    accuracy: {
      en: {
        friendlyName: "Accuracy",
        unit: "m",
      },
      fr: {
        friendlyName: "Précision",
        unit: "m",
      },
    },
  },
};
