import { KDocumentContent } from "kuzzle-sdk";

export interface MeasureAdapterMapping {
  sourceMeasureName: string;
  targetMeasureName: string;
  targetType: string;
}

export interface MeasureAdapterContent extends KDocumentContent {
  name: string;
  source: string;
  mapping: MeasureAdapterMapping[];
}
