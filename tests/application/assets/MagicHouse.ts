import { AssetModelDefinition } from "../../../index";

export const magicHouseAssetDefinition: AssetModelDefinition = {
  measures: [
    { name: "magiculeExt", type: "magicule" },
    { name: "magiculeInt", type: "magicule" },
  ],
  metadataMappings: {
    power: { type: "integer" },
  },
};
