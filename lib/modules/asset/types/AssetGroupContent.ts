import { KDocumentContent } from "kuzzle-sdk";
import { Metadata } from "lib/modules/shared";

export interface AssetsGroupsBody<TMetadata extends Metadata = Metadata>
  extends KDocumentContent {
  name: string;
  model?: string | null;
  path: string;
  lastUpdate: number;
  metadata?: TMetadata;
}

export type AssetsGroupContent<TMetadata extends Metadata = any> =
  AssetsGroupsBody<TMetadata>;
