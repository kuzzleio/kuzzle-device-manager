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
  },
};
