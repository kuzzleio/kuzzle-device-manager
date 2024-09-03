import { CollectionMappings } from "kuzzle";

/**
 * Base mappings for the "devices" collection.
 *
 * Those mappings does not contains the `metadata` mappings.
 */
export const devicesMappings: CollectionMappings = {
  dynamic: "strict",
  properties: {
    model: {
      type: "keyword",
      fields: { text: { type: "text" } },
    },
    reference: {
      type: "keyword",
      fields: { text: { type: "text" } },
    },
    assetId: {
      type: "keyword",
      fields: { text: { type: "text" } },
    },
    engineId: {
      type: "keyword",
      fields: { text: { type: "text" } },
    },
    metadata: {
      properties: {
        // populated with device models
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
