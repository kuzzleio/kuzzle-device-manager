import { BaseRequest, JSONObject, Kuzzle } from "kuzzle-sdk";
import { loadSecurityDefault } from "./security";

async function createEngineIfNotExists(
  sdk: Kuzzle,
  index: string,
  group?: string,
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
  await loadSecurityDefault(sdk);
  if ((await sdk.auth.getCurrentUser())._id !== "test-admin") {
    await sdk.auth.login("local", {
      username: "test-admin",
      password: "password",
    });
  }
  await Promise.all([
    createEngineIfNotExists(sdk, "engine-ayse"),
    createEngineIfNotExists(sdk, "engine-kuzzle"),
    createEngineIfNotExists(sdk, "engine-other-group", "other-group"),
    // Timeout to avoid too many login per seconds error
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ]);
}
