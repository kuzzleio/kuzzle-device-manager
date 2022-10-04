import { KDocumentContent } from "kuzzle-sdk";

export interface TreeNodeContent extends KDocumentContent {
  name: string;
  chidren: TreeNodeContent;
}
