import { BaseRequest, JSONObject, Kuzzle } from "kuzzle-sdk";

async function createEngineIfNotExists(sdk: Kuzzle, index: string) {
  const { result } = await sdk.query<BaseRequest, JSONObject>({
    controller: "device-manager/engine",
    action: "exists",
    index,
  });

  if (result.exists) {
    return;
  }

  await sdk.query({
    controller: "device-manager/engine",
    action: "create",
    index,
  });
}

export async function beforeAllCreateEngines(sdk: Kuzzle) {
  await Promise.all([
    createEngineIfNotExists(sdk, "engine-ayse"),
    createEngineIfNotExists(sdk, "engine-kuzzle"),
  ]);
}
