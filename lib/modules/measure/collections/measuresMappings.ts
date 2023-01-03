export const measuresMappings = {
  dynamic: "strict",
  properties: {
    type: { type: "keyword" },

    values: {
      properties: {
        // populated with measure models mappings
      },
    },

    /**
     * Micro Timestamp of the measurement time.
     */
    measuredAt: { type: "date" },

    asset: {
      properties: {
        _id: { type: "keyword" },
        model: { type: "keyword" },
        reference: { type: "keyword" },
        measureName: { type: "keyword" },
        metadata: {
          properties: {
            // populated with asset models metadata mappings
          },
        },
      },
    },

    /**
     * Define the origin of the measure.
     */
    origin: {
      properties: {
        type: { type: "keyword" },

        measureName: { type: "keyword" },

        payloadUuids: { type: "keyword" },

        deviceModel: { type: "keyword" },

        reference: { type: "keyword" },

        _id: { type: "keyword" },
      },
    },
  },
};
