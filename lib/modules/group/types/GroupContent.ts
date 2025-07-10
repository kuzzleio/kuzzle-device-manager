import { KDocumentContent } from "kuzzle-sdk";
import { Metadata } from "lib/modules/shared";

export interface GroupsBody<TMetadata extends Metadata = Metadata>
  extends KDocumentContent {
  name: string;
  model?: string | null;
  path: string;
  lastUpdate: number;
  metadata?: TMetadata;
}

export type GroupContent<TMetadata extends Metadata = any> =
  GroupsBody<TMetadata>;
