import { fieldPathMappings } from "../../lib/mappings/fieldpathMappings";

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
