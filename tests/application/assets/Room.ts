import { AssetModelDefinition } from "../../../index";

export const roomAssetDefinition: AssetModelDefinition = {
  measures: [
    {
      name: "temperature",
      type: "temperature",
    },
    {
      name: "humidity",
      type: "humidity",
    },
  ],
  metadataMappings: {
    floor: { type: "integer" },
    width: { type: "integer" },
  },
};
