import { AssetModelDefinition } from "../../../index";

export const streetLampAssetDefinition: AssetModelDefinition = {
  measures: [
    {
      name: "brightness",
      type: "brightness",
    },
    {
      name: "powerConsumption",
      type: "powerConsumption",
    },
  ],
  metadataMappings: {
    position: { type: "geo_point" },
    street: { type: "keyword" },
  },
};
