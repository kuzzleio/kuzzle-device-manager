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
    linkedAssets: {
      properties: {
        _id: { type: "keyword" },
        measureNames: {
          properties: {
            asset: { type: "keyword" },
            device: { type: "keyword" },
            type: { type: "keyword" },
          },
        },
      },
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
    associatedAt: { type: "date" },

    measureSlots: {
      properties: {
        name: { type: "keyword" },
        type: { type: "keyword" },
      },
    },
  },
};

/**
 * Mappings for the "devices" collection of the platform index.
 *
 * Those mappings does not contains the `measures`, `groups` and `metadata` mappings.
 */
export const devicesPlatformMappings: CollectionMappings = {
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
    provisionedAt: { type: "date" },
    lastMeasures: {
      properties: {
        /**
         * The type of measurement.
         */
        type: { type: "keyword" },
        /**
         * The values of the measurement.
         */
        values: {
          properties: {
            // populated with measure models mappings
          },
        },
        /**
         * Device name for the measure.
         */
        measureName: { type: "keyword" },
        /**
         * Micro Timestamp of the measurement time.
         */
        measuredAt: { type: "date" },
      },
    },
  },
};
