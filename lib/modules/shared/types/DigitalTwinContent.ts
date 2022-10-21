import { KDocumentContent } from "kuzzle";

import { MeasureContent } from "../../measure";

import { Metadata } from "./Metadata";

export interface DigitalTwinContent extends KDocumentContent {
  model: string;

  reference: string;

  metadata: Metadata;

  measures: MeasureContent[];
}
