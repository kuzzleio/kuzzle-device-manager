import { KDocumentContent } from "kuzzle-sdk";

export interface AssetsGroupsBody {
  name: string;
  type?: string;
  children: string[];
  parent: string | null;
  lastUpdate: number;
}

export type AssetsGroupContent = AssetsGroupsBody & KDocumentContent;
