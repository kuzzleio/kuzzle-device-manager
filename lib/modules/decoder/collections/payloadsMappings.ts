export const payloadsMappings = {
  dynamic: "strict",
  properties: {
    deviceModel: { type: "keyword" },
    payload: {
      dynamic: "false",
      properties: {},
    },
    uuid: { type: "keyword" },
    valid: { type: "boolean" },
    apiAction: { type: "keyword" },
    state: { type: "keyword" },
    reason: { type: "keyword" },
  },
};
