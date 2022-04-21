/* eslint-disable sort-keys */

export const measuresMappings = {
  dynamic: 'strict',
  properties: {
    measuredAt: { type: 'double' },

    /**
     * A device may have different measures for the same type (e.g. measure temperature 2 times)
     * Should be set when you link the device to the asset
     */
    name: { type: 'keyword' },

    origin: {
      type: 'nested',

      properties: {
        // ID of the device (document _id)
        id: { type: 'keyword' },

        // E.g. "AbeewayTemp"
        model: { type: 'keyword' },

        // Array of payload uuids that were used to create this measure.
        payloadUuids: { type: 'keyword' },

        // E.g. "device"
        type: { type: 'keyword' },

        // Asset linked to the device when the measure was made
        assetId: { type: 'keyword' },
      }
    },


    /**
     * Type of the measure. (e.g. "temperature")
     * The type name is also the name of the sub-property to look at
     * in the "values" object to get the measure main value.
     */
    type: { type: 'keyword' },

    /**
     * Measure self-description
     */
    unit: {
      dynamic: 'false',
      properties: {}
    },

    values: {
      properties: {},
    },
  }
};

/* eslint-enable sort-keys */
