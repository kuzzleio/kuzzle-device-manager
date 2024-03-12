import { AssetModelDefinition } from "../../../index";

export const warehouseAssetDefinition: AssetModelDefinition = {
  measures: [{ name: "position", type: "position" }],
  metadataMappings: {
    surface: { type: "integer" },
  },
};
