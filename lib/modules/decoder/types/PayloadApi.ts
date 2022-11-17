import { JSONObject } from "kuzzle";

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
