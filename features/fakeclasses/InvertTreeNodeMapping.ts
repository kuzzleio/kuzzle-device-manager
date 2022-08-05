import { fieldPathMappings } from '../../lib/mappings/fieldpathMappings';

export const InvertTreeNodeMappings = {
  dynamic: 'strict',
  properties: {

    children: fieldPathMappings,
    name: {
      type: 'keyword'
    },
    parent: {
      dynamic: 'true',
      properties: {
      }
    }
  }
}