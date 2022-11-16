/* eslint-disable sort-keys */

export const assetsMappings = {
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

    metadata: {
      properties: {
        // populated with asset models
      },
    },

    measures: {
      properties: {
        // populated with asset models
      },
    },

    linkedDevices: {
      properties: {
        id: { type: "keyword" },
        measures: {
          dynamic: "false",
          properties: {},
        },
      },
    },
  },
};
