import { JSONObject, KDocumentContent } from "kuzzle";

import { MeasureContent } from "../../measure";

import { Metadata } from "./Metadata";

export interface DigitalTwinContent<
  TMeasurementValues extends JSONObject = JSONObject,
  TMetadata extends Metadata = Metadata
> extends KDocumentContent {
  model: string;

  reference: string;

  metadata: TMetadata;

  measures: MeasureContent<TMeasurementValues, TMetadata>[];
}
