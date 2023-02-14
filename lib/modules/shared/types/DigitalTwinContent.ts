import { JSONObject, KDocumentContent } from "kuzzle-sdk";

import { EmbeddedMeasure } from "./EmbeddedMeasure";
import { Metadata } from "./Metadata";

export interface DigitalTwinContent<
  TMeasures extends JSONObject = JSONObject,
  TMetadata extends Metadata = Metadata
> extends KDocumentContent {
  model: string;

  reference: string;

  metadata: TMetadata;

  measures: {
    [Property in keyof TMeasures]: EmbeddedMeasure<TMeasures[Property]> | null;
  };
}
