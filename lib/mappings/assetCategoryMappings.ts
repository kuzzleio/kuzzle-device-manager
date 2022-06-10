
import { fieldPathMappings } from './fieldpathMappings';

export const assetCategoryMappings = {
  dynamic: 'strict',
  properties: {
    assetMetadata: {
      type: 'keyword',
    },
    children: fieldPathMappings,
    metadataValues: { //Hashmap mapping...
      dynamic: 'true',
      properties: {}
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