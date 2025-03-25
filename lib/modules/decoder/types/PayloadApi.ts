import { JSONObject, KDocument } from "kuzzle-sdk";
import { PayloadContent } from "./PayloadContent";

interface PayloadsControllerRequest {
  controller: "device-manager/payloads";
}

export interface ApiPayloadReceiveUnkownRequest
  extends PayloadsControllerRequest {
  action: "receiveUnknown";

  deviceModel: string;

  body: JSONObject;
}
export type ApiPayloadReceiveUnkownResult = void;

export interface ApiPayloadGetRequest extends PayloadsControllerRequest {
  action: "get";
  _id: string;
}
export type ApiPayloadGetResult = KDocument<PayloadContent>;
