import { BaseRequest, JSONObject, Kuzzle } from "kuzzle-sdk";

async function createEngineIfNotExists(
  sdk: Kuzzle,
  index: string,
  group?: string
) {
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
    group,
  });
}

export async function beforeAllCreateEngines(sdk: Kuzzle) {
  await Promise.all([
    createEngineIfNotExists(sdk, "engine-ayse"),
    createEngineIfNotExists(sdk, "engine-kuzzle"),
    createEngineIfNotExists(sdk, "engine-other-group", "other-group"),
  ]);
}
