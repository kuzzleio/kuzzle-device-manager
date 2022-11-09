import { CollectionMappings } from "kuzzle";

/* eslint-disable sort-keys */

export const modelsMappings: CollectionMappings = {
  dynamic: "strict",
  properties: {
    type: { type: "keyword" },
    engineGroup: { type: "keyword" },

    measure: {
      properties: {
        type: { type: "keyword" },
        unit: {
          properties: {
            name: { type: "keyword" },
            sign: { type: "keyword" },
            type: { type: "keyword" },
          },
        },
        valuesMappings: {
          dynamic: "false",
          properties: {},
        },
      },
    },

    asset: {
      properties: {
        model: { type: "keyword" },
        metadataMappings: {
          dynamic: "false",
          properties: {},
        },
        defaultValues: {
          dynamic: "false",
          properties: {},
        },
        measures: {
          dynamic: "false",
          properties: {},
        },
      },
    },

    device: {
      properties: {
        model: { type: "keyword" },
        metadataMappings: {
          dynamic: "false",
          properties: {},
        },
        defaultValues: {
          dynamic: "false",
          properties: {},
        },
        measures: {
          dynamic: "false",
          properties: {},
        },
      },
    },
  },
};
