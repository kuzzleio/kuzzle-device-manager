/**
 * Base mappings for the "devices" collection.
 *
 * Those mappings does not contains the `measures` and `metadata` mappings.
 */
export const devicesMappings = {
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
    measures: {
      properties: {
        // populated with measure models
      },
    },
  },
};
