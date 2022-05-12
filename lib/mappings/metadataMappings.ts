import { fieldPathMappings } from './fieldpathMappings';

export const metadataMappings = {
  dynamic: 'strict',
  properties: {
    AssetCategory: fieldPathMappings,
    mandatory: {
      type: 'boolean'
    },
    name: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
    unit: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
    valueList: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
    valueType: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
  }
};