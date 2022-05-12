
import { metadataMappings } from './metadataMappings';
import { fieldPathMappings } from './fieldpathMappings';

function embedded (mapping) {
  mapping.properties._kuzzleId = {
    fields: {
      text: { type: 'text' }
    },
    type: 'keyword'
  };
  return mapping;
}

export const assetCategoryMappings = {
  dynamic: 'strict',
  properties: {
    assetMetadatas: embedded(metadataMappings),
    children: fieldPathMappings,
    metadatasValues: { //Hashmap mapping...
      dynamic: 'true',
      properties: {}
    },
    name: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
    parent: { //recursive embbeded : TODO : replace by embeded!
      dynamic: 'true',
      properties: {
        _kuzzleId: {
          fields: {
            text: { type: 'text' }
          },
          type: 'keyword'
        }
      }
    },
  }
};