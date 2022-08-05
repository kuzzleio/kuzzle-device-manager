

export const simplifiedMetadataValue =
  {
    dynamic: 'strict',
    properties: {
      key: {
        type: 'keyword'
      },
      value: {
        properties: {
          boolean: { type: 'boolean' },
          geo_point: { type: 'geo_point' },
          integer: { type: 'integer' },
          keyword: { type: 'keyword' },
        }
      }
    },
    type: 'nested',
  };

export const metadataValue =
  {
    dynamic: 'strict',
    properties: {
      key: {
        type: 'keyword'
      },
      value: {
        properties: {
          boolean: { type: 'boolean' },
          geo_point: { type: 'geo_point' },
          integer: { type: 'integer' },
          keyword: { type: 'keyword' },
          object: simplifiedMetadataValue
        }
      }
    },
    type: 'nested',
  };


export const metadataMappings = {
  dynamic: 'strict',
  properties: {
    mandatory: {
      type: 'boolean'
    },
    name: {
      type: 'keyword'
    },
    objectValueList: {
      properties: {
        object: metadataValue
      }
    },
    unit: {
      type: 'keyword'
    },
    valueList: {
      type: 'keyword'
    },

    valueType: {
      type: 'keyword'
    },
  }
};