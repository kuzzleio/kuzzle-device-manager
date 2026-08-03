import { KDocumentContent } from "kuzzle-sdk";

export interface MeasureAdapterContent extends KDocumentContent {
  name: string;

  sourceType: string;

  targetMeasureName: string;

  targetType: string;

  targetField: string;
}
