export const fieldPathMappings = {
  dynamic: 'strict',
  properties: {
    collection: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
    document: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
    field: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
    index: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
  }
};