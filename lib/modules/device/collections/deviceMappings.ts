import { CollectionMappings } from "kuzzle";

/**
 * Base mappings for the "devices" collection.
 *
 * Those mappings does not contains the `measures` and `metadata` mappings.
 */
export const devicesMappings: CollectionMappings = {
  dynamic: "strict",
  properties: {
    model: {
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
    lastMeasuredAt: { type: "date" },
    measureSlots: {
      properties: {
        name: { type: "keyword" },
        type: { type: "keyword" },
      },
    },
  },
};

/**
 * Mappings for the "devices" collection of the admin index.
 *
 * Those mappings does not contains the `measures`, `groups` and `metadata` mappings.
 */
export const devicesAdminMappings: CollectionMappings = {
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
    lastMeasuredAt: { type: "date" },
    measureSlots: {
      properties: {
        name: { type: "keyword" },
        type: { type: "keyword" },
      },
    },
  },
};
