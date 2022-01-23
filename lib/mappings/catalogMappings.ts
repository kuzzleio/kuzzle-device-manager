export const catalogMappings = {
  dynamic: 'strict',

  properties: {
    assetId: { type: 'keyword' },

    authorized: { type: 'boolean' },

    deviceId: { type: 'keyword' },

    tenantId: { type: 'keyword' },
  },
};
