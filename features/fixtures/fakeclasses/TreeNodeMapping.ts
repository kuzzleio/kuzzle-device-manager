import { fieldPathMappings } from '../../../lib/mappings/fieldpathMappings';

export const TreeNodeMappings = {
  dynamic: 'strict',
  properties: {
    chidren: {
      properties: {
        dynamic: 'true',
      }
    },
    name: {
      type: 'keyword'
    },
    parent: fieldPathMappings
  }
}