import { MeasureModel } from "../../../index";

export const PowerConsumption: MeasureModel = {
  modelName: "powerConsumption",
  definition: {
    scope: "asset",
    valuesMappings: { watt: { type: "float" } },
  },
};
