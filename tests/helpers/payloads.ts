import { JSONObject, Kuzzle } from "kuzzle-sdk";

export async function sendDummyTemp (sdk: Kuzzle, body: JSONObject) {
  await sdk.query({
    controller: "device-manager/payloads",
    action: "dummy-temp",
    body,
  });
}