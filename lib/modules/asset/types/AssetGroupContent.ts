import { KDocumentContent } from "kuzzle-sdk";

export interface AssetsGroupsBody {
  name: string;
  children: string[];
  parent: string | null;
}

export type AssetsGroupContent = AssetsGroupsBody & KDocumentContent;
