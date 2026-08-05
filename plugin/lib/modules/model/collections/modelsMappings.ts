import { CollectionMappings } from "kuzzle";

/* eslint-disable sort-keys */

/**
 * Mappings for models configuration documents
 */
export const modelsMappings: CollectionMappings = {
  dynamic: "strict",
  properties: {
    type: { type: "keyword" },
    engineGroups: { type: "keyword" },
    engineIds: { type: "keyword" },

    /**
     * Measure model
     */
    measure: {
      properties: {
        type: { type: "keyword" },
        scope: { type: "keyword" },
        icon: { type: "text", index: false },
        valuesMappings: {
          dynamic: "false",
          properties: {},
        },
        validationSchema: {
          dynamic: "false",
          properties: {},
        },
        valuesDetails: {
          dynamic: "false",
          properties: {},
        },
        locales: {
          dynamic: "false",
          properties: {},
        },
      },
    },

    /**
     * Asset model
     */
    asset: {
      properties: {
        model: { type: "keyword" },
        icon: { type: "text", index: false },
        metadataMappings: {
          dynamic: "false",
          properties: {},
        },
        defaultMetadata: {
          dynamic: "false",
          properties: {},
        },
        metadataDetails: {
          dynamic: "false",
          properties: {},
        },
        metadataGroups: {
          dynamic: "false",
          properties: {},
        },
        measures: {
          properties: {
            type: { type: "keyword" },
            name: { type: "keyword" },
          },
        },
        tooltipModels: {
          dynamic: "false",
          properties: {},
        },
        locales: {
          dynamic: "false",
          properties: {},
        },
      },
    },

    /**
     * Device model
     */
    device: {
      properties: {
        model: { type: "keyword" },
        icon: { type: "text", index: false },
        metadataMappings: {
          dynamic: "false",
          properties: {},
        },
        defaultMetadata: {
          dynamic: "false",
          properties: {},
        },
        metadataDetails: {
          dynamic: "false",
          properties: {},
        },
        metadataGroups: {
          dynamic: "false",
          properties: {},
        },
        measures: {
          properties: {
            type: { type: "keyword" },
            name: { type: "keyword" },
          },
        },
      },
    },

    /**
     * Group model
     */
    group: {
      properties: {
        model: { type: "keyword" },
        icon: { type: "text", index: false },
        affinity: {
          properties: {
            type: {
              type: "keyword",
            },
            models: {
              properties: {
                assets: {
                  type: "keyword",
                },
                devices: {
                  type: "keyword",
                },
              },
            },
            strict: { type: "boolean" },
          },
        },
        metadataMappings: {
          dynamic: "false",
          properties: {},
        },
        defaultMetadata: {
          dynamic: "false",
          properties: {},
        },
        metadataDetails: {
          dynamic: "false",
          properties: {},
        },
        metadataGroups: {
          dynamic: "false",
          properties: {},
        },
        tooltipModels: {
          dynamic: "false",
          properties: {},
        },
      },
    },
  },
};
