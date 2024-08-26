import { JSONObject, KDocumentContent } from "kuzzle-sdk";

import { Metadata } from "./Metadata";
import { DigitalTwinMeasures } from "./DigitalTwinMeasures";

export interface DigitalTwinContent<
  TMeasures extends JSONObject = JSONObject,
  TMetadata extends Metadata = Metadata,
> extends KDocumentContent {
  model: string;

  reference: string;

  metadata: TMetadata;

  measures: DigitalTwinMeasures<TMeasures>;

  lastMeasuredAt: number;
}
