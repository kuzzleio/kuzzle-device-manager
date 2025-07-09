import { KDocumentContent } from "kuzzle-sdk";
import { Metadata } from "lib/modules/shared";

export interface GroupsBody {
  name: string;
  model?: string | null;
  path: string;
  lastUpdate: number;
  metadata?: Metadata;
}

export type GroupContent = GroupsBody & KDocumentContent;
