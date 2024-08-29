import { AssetModelDefinition } from "../../../index";

export const streetLampAssetDefinition: AssetModelDefinition = {
  measures: [
    {
      name: "position",
      type: "position",
    },
  ],
  metadataMappings: {
    street: { type: "keyword" },
  },
};
