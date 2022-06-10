import { fieldPathMappings } from './fieldpathMappings';

export const metadataMappings = {
  dynamic: 'strict',
  properties: {
    AssetCategory: fieldPathMappings,
    mandatory: {
      type: 'boolean'
    },
    name: {
      type: 'keyword'
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