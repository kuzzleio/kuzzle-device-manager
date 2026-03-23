import { CollectionMappings } from "kuzzle-sdk";

/**
 * Base mappings for the "actions" collection.
 *
 * Stores action execution records: dispatched commands, their arguments,
 * status, and timestamps.
 */
export const actionsMappings: CollectionMappings = {
  dynamic: "strict",
  properties: {
    type: { type: "keyword" },

    args: {
      dynamic: "false",
      properties: {},
    },

    /**
     * Timestamp when the action was dispatched.
     */
    dispatchedAt: { type: "date" },

    /**
     * Timestamp when the action was acknowledged by the device.
     */
    acknowledgedAt: { type: "date" },

    /**
     * Current status of the action.
     */
    status: { type: "keyword" },

    asset: {
      properties: {
        _id: { type: "keyword" },
        model: { type: "keyword" },
        reference: { type: "keyword" },
        actionName: { type: "keyword" },
      },
    },

    origin: {
      properties: {
        type: { type: "keyword" },
        actionName: { type: "keyword" },
        deviceModel: { type: "keyword" },
        reference: { type: "keyword" },
        _id: { type: "keyword" },
      },
    },
  },
};
