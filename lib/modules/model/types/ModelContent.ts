import { JSONObject, KDocumentContent } from "kuzzle";

import { MeasureDefinition } from "../../measure";

export interface MeasureModelContent extends KDocumentContent {
  type: "measure";

  measure: MeasureDefinition & {
    name: string;
  };
}

export interface AssetModelContent extends KDocumentContent {
  type: "asset";

  engineGroup: string;

  asset: {
    model: string;
    metadataMappings: JSONObject;
  };
}

export interface DeviceModelContent extends KDocumentContent {
  type: "device";

  device: {
    model: string;
    metadataMappings: JSONObject;
  };
}

export type ModelContent =
  | MeasureModelContent
  | AssetModelContent
  | DeviceModelContent;
