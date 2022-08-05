export const payloadsMappings = {
  dynamic: 'strict',
  properties: {
    deviceModel: { type: 'keyword' },
    payload: {
      dynamic: 'false',
      properties: {}
    },
    rawPayload: {
      dynamic: 'false',
      properties: {}
    },
    uuid: { type: 'keyword' },
    valid: { type: 'boolean' },
  }
};
