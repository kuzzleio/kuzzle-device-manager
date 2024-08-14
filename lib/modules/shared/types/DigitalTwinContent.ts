import { JSONObject, KDocumentContent } from "kuzzle-sdk";

import { NamedMeasures } from "../../decoder";
import { Metadata } from "./Metadata";
import { DigitalTwinMeasures } from "./DigitalTwinMeasures";

export interface DigitalTwinContent<TMetadata extends Metadata = Metadata>
  extends KDocumentContent {
  model: string;

  reference: string;

  metadata: TMetadata;

  measureSlots: NamedMeasures;
}

export interface DigitalTwinContentWithMeasures<
  TMeasures extends JSONObject = JSONObject,
  TMetadata extends Metadata = Metadata,
> extends DigitalTwinContent<TMetadata> {
  measures: DigitalTwinMeasures<TMeasures>;
}
