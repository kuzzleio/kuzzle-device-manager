import { MeasureModel } from "../../../index";

export const Illuminance: MeasureModel = {
  modelName: "illuminance",
  definition: {
    scope: "asset",
    valuesMappings: { illuminance: { type: "float" } },
  },
};
