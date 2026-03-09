import { CollectionMappings } from "kuzzle";

export const assetGroupsMappings: CollectionMappings = {
  dynamic: "strict",
  properties: {
    children: {
      fields: {
        text: {
          type: "text",
        },
      },
      type: "keyword",
    },
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
    parent: {
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
