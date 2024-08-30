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
    {
      name: "co2",
      type: "co2",
    },
    {
      name: "illuminance",
      type: "illuminance",
    },
  ],
  metadataMappings: {
    floor: { type: "integer" },
    width: { type: "integer" },
  },
};
