import { fieldPathMappings } from "../../lib/modules/metadata/collections/fieldpathMappings";

export const TreeNodeMappings = {
  dynamic: "strict",
  properties: {
    children: {
      dynamic: "true",
      properties: {},
    },
    name: {
      type: "keyword",
    },
    parent: fieldPathMappings,
  },
};
