import { CollectionMappings } from "kuzzle-sdk";

export const measureAdaptersMappings: CollectionMappings = {
  dynamic: "strict",
  properties: {
    name: {
      type: "keyword",
      fields: { text: { type: "text" } },
    },
    source: { type: "keyword" },
    mapping: {
      properties: {
        sourceMeasureName: { type: "keyword" },
        targetMeasureName: { type: "keyword" },
        targetType: { type: "keyword" },
      },
    },
  },
};
