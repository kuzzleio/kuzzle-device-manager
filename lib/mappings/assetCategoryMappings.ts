import { metadataValue } from './metadataMappings';

export const assetCategoryMappings = {
  dynamic: 'strict',
  properties: {
    assetMetadata: {
      type: 'keyword',
    },
    metadataValues: metadataValue,
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