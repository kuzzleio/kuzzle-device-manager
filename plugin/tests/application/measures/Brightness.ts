import { MeasureModel } from "../../../index";

export const Brightness: MeasureModel = {
  modelName: "brightness",
  definition: {
    scope: "asset",
    valuesMappings: { lumens: { type: "float" } },
  },
};
