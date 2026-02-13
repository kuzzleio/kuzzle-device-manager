import { CollectionMappings } from "kuzzle";

export const groupsMappings: CollectionMappings = {
  dynamic: "strict",
  properties: {
    metadata: {
      properties: {
        // populated with group models
      },
    },
    name: {
      fields: {
        text: {
          type: "text",
        },
      },
      type: "keyword",
    },
    path: {
      fields: {
        text: {
          type: "text",
        },
      },
      type: "keyword",
    },
    model: {
      fields: {
        text: {
          type: "text",
        },
      },
      type: "keyword",
    },
    lastUpdate: {
      type: "date",
    },
  },
};
