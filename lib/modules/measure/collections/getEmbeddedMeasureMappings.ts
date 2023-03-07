import { JSONObject } from "kuzzle-sdk";

export const getEmbeddedMeasureMappings: (values: JSONObject) => JSONObject = (
  valuesMappings
) => ({
  properties: {
    measuredAt: { type: "date" },
    name: { type: "keyword" },
    payloadUuids: { type: "keyword" },
    type: { type: "keyword" },
    values: {
      properties: valuesMappings,
    },
    originId: { type: "keyword" },
  },
});
