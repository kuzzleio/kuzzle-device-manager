import { MeasureDefinition } from "lib/modules/measure";

export type MagiculeMeasurement = {
  magicule: number;
};

export const magiculeMeasureDefinition: MeasureDefinition = {
  valuesMappings: {
    magicule: { type: "integer" },
  },
  validationSchema: {
    type: "object",
    properties: {
      magicule: { type: "integer" },
    },
    required: ["magicule"],
    additionalProperties: false,
  },
};
