import { MeasureModel } from "../../../index";

export type MagiculeMeasurement = {
  magicule: number;
};

export const Magicule: MeasureModel = {
  modelName: "magicule",
  definition: {
    scope: "asset",
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
  },
};
