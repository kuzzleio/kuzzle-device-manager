import { JSONObject } from "kuzzle";

export interface BaseAssetContent {
  type: string;
  model: string;
  reference: string;
  measures?: JSONObject,
  metadata?: JSONObject,
};
