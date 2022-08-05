export const devicesMappings = {
  dynamic: 'strict',
  properties: {
    assetId: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },  
    engineId: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
    measures: {
      properties: {
        // measures mappings will be injected by the plugin
      }
    },
    metadata: {
      dynamic: 'false',
      properties: {},
    },
    model: {
      fields: {
        text: { type: 'text' },
      },
      type: 'keyword'
    },
    reference: {
      fields: {
        text: { type: 'text' },
      },
      type: 'keyword'
    }
  }
};
