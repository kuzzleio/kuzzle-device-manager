import { CollectionMappings } from "kuzzle";

/**
 * Base mappings for the "assets" collection.
 *
 * Those mappings does not contains the `measures` and `metadata` mappings.
 */
export const assetsMappings: CollectionMappings = {
  dynamic: "strict",
  properties: {
    model: {
      type: "keyword",
      fields: { text: { type: "text" } },
    },
    modelLocales: {
      dynamic: "false",
      properties: {
        en: {
          properties: {
            description: {
              type: "text",
            },
            friendlyName: {
              type: "keyword",
              fields: { text: { type: "text" } },
            },
          },
        },
        fr: {
          properties: {
            description: {
              type: "text",
            },
            friendlyName: {
              type: "keyword",
              fields: { text: { type: "text" } },
            },
          },
        },
      },
    },
    reference: {
      type: "keyword",
      fields: { text: { type: "text" } },
    },
    groups: {
      properties: {
        path: {
          type: "keyword",
          fields: { text: { type: "text" } },
        },
        date: { type: "date" },
      },
    },
    metadata: {
      properties: {
        // populated with asset models
      },
    },
    linkedMeasures: {
      properties: {
        deviceId: { type: "keyword" },
        measureSlots: {
          properties: {
            asset: { type: "keyword" },
            device: { type: "keyword" },
          },
        },
      },
    },

    measureSlots: {
      properties: {
        name: { type: "keyword" },
        type: { type: "keyword" },
      },
    },
  },
};
