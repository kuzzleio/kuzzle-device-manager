import { KDocumentContent } from "kuzzle-sdk";

export interface MeasureAdapterContent extends KDocumentContent {
  name: string;

  measureModelSource: string;

  fieldMapping: Array<{
    measureModelTarget: string;

    source: string;

    target: string;
  }>;
}
