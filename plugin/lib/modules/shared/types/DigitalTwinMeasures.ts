import { JSONObject } from "kuzzle-sdk";

import { EmbeddedMeasure } from "./EmbeddedMeasure";

export type DigitalTwinMeasures<TMeasures extends JSONObject = JSONObject> = {
  [Property in keyof TMeasures]: EmbeddedMeasure<TMeasures[Property]> | null;
};
