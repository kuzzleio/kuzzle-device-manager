/* eslint-disable sort-keys */

import { metadataValue } from "./../../metadata";

export const measuresMappings = {
  dynamic: "strict",
  properties: {
    /**
     * Type of the measure. (e.g. "temperature")
     * The type name is also the name of the sub-property to look at
     * in the "values" object to get the measure main value.
     */
    type: { type: "keyword" },

    /**
     * Property containing the actual measurement.
     *
     * This should be specialized by child interfaces.
     */
    values: {
      properties: {},
    },

    /**
     * Micro Timestamp of the measurement time.
     */
    measuredAt: { type: "date" },

    /**
     * Name given by the decoder to the measure.
     */
    deviceMeasureName: { type: "keyword" },

    /**
     * Name given by the `deviceLink` of the linked asset.
     */
    assetMeasureName: { type: "keyword" },

    /**
     * Measurement self-description.
     */
    unit: {
      dynamic: "false",
      properties: {},
    },
    asset: {
      properties: {
        _id: { type: "keyword" },
        _source: {
          properties: {
            category: { type: "keyword" },
            metadata: metadataValue,
            model: { type: "keyword" },
            reference: { type: "keyword" },
            type: { type: "keyword" },
          },
        },
      },
    },

    /**
     * Define the origin of the measure.
     */
    origin: {
      properties: {
        /**
         * From what the measure has been pushed. Can be:
         * - 'asset'
         * - 'device'
         */
        type: { type: "keyword" },

        /**
         * Array of payloads uuids that were used to create this measure.
         */
        payloadUuids: { type: "keyword" },

        // E.g. "AbeewayTemp"
        deviceModel: { type: "keyword" },

        /**
         * ID of the origin. Can be:
         * - device id if origin type is `device`
         * - user id if origin type is `asset`
         */
        id: { type: "keyword" },
      },
    },
  },
};

/* eslint-enable sort-keys */
