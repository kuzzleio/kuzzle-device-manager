import { KDocument } from "kuzzle-sdk";
import { RawPayloadsContent } from "./RawPayloadsContent";

interface RawPayloadsControllerRequest {
  controller: "device-manager/rawPayloads";
}

export interface ApiRawPayloadsGetRequest extends RawPayloadsControllerRequest {
  action: "get";
  _id: string;
}
export type ApiRawPayloadsGetResult = KDocument<RawPayloadsContent>;
