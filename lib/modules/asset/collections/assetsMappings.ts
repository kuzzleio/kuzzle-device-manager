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
        // populated with measure models
      },
    },
    deviceLinks: {
      properties: {
        deviceId: {
          type: "keyword",
          fields: { text: { type: "text" } },
        },
        measureNamesLinks: {
          properties: {
            assetMeasureName: {
              type: "keyword",
              fields: { text: { type: "text" } },
            },
            deviceMeasureName: {
              type: "keyword",
              fields: { text: { type: "text" } },
            },
          },
        },
      },
    },
  },
};
