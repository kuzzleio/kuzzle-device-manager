import { KDocumentContent } from "kuzzle-sdk";

import { NamedMeasures } from "../../decoder";
import { Metadata } from "./Metadata";
import { LocaleDetails } from "lib/modules/model";

export interface DigitalTwinContent<TMetadata extends Metadata = Metadata>
  extends KDocumentContent {
  model: string;

  modelLocales?: { [locale: string]: LocaleDetails };

  reference: string;

  metadata: TMetadata;

  measureSlots: NamedMeasures;
}
