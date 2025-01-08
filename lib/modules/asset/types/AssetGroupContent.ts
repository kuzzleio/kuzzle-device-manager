import { KDocumentContent } from "kuzzle-sdk";

export interface AssetsGroupsBody {
  name: string;
  type: string | null;
  children: string[];
  parent: string | null;
  lastUpdate: number;
}

export type AssetsGroupContent = AssetsGroupsBody & KDocumentContent;
