import { JSONObject, KDocumentContent } from "kuzzle-sdk";

export interface PayloadContent extends KDocumentContent {
  apiAction: string;
  deviceModel: string;
  payload: JSONObject;
  reason?: string;
  state?: string;
  uuid: string;
  valid: boolean;
}
