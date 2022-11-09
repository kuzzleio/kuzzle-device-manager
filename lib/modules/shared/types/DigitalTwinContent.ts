import { KDocumentContent } from "kuzzle";

import { EmbeddedMeasure } from "./EmbeddedMeasure";
import { Metadata } from "./Metadata";

export type DigitalTwinMeasures = {
  [measureName: string]: EmbeddedMeasure;
};

export interface DigitalTwinContent<
  TMeasures extends DigitalTwinMeasures = DigitalTwinMeasures,
  TMetadata extends Metadata = Metadata
> extends KDocumentContent {
  model: string;

  reference: string;

  metadata: TMetadata;

  measures: TMeasures;
}
