import { MeasureModel } from "../../../index";

export const CO2: MeasureModel = {
  modelName: "co2",
  definition: {
    scope: "asset",
    valuesMappings: { co2: { type: "float" } },
  },
};
