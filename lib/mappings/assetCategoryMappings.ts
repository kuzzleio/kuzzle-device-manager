export const assetCategoryMappings = {
  dynamic: 'strict',
  properties: {
    assetMetadata: {
      type: 'keyword',
    },
    metadataValues: {
      dynamic: 'strict',
      properties: {
        key: { type: 'keyword' },
        value: {
          properties: {
            boolean: { type: 'boolean' },
            geo_point: { type: 'geo_point' },
            integer: { type: 'integer' },
            keyword: { type: 'keyword' },
          }
        }
      }
    },
    name: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
    parent: {
      type: 'keyword'
    },
  }
};