import { fieldPathMappings } from "../../lib/modules/metadata/collections/fieldpathMappings";

export const InvertTreeNodeMappings = {
  dynamic: "strict",
  properties: {
    children: fieldPathMappings,
    name: {
      type: "keyword",
    },
    parent: {
      dynamic: "true",
      properties: {},
    },
  },
};
