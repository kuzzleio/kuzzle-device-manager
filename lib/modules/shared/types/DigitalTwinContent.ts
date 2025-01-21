import { JSONObject, KDocumentContent } from "kuzzle-sdk";

import { Metadata } from "./Metadata";
import { DigitalTwinMeasures } from "./DigitalTwinMeasures";
import { LocaleDetails } from "lib/modules/model";

export interface DigitalTwinContent<
  TMeasures extends JSONObject = JSONObject,
  TMetadata extends Metadata = Metadata,
> extends KDocumentContent {
  model: string;

  modelLocales?: { [locale: string]: LocaleDetails };

  reference: string;

  metadata: TMetadata;

  measures: DigitalTwinMeasures<TMeasures>;

  lastMeasuredAt: number;
}
