import { JSONObject } from "kuzzle";

import { Decoder, NamedMeasures } from "../../../modules/decoder";

export type AssetModelDefinition = {
  measuresNames: NamedMeasures;
  metadataMappings: JSONObject;
  defaultMetadata?: JSONObject;
};

export type DeviceModelDefinition = {
  decoder: Decoder;
  metadataMappings: JSONObject;
  defaultMetadata?: JSONObject;
};
