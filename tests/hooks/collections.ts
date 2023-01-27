import { Kuzzle } from "kuzzle-sdk";

export async function truncateCollection(
  sdk: Kuzzle,
  index: string,
  collection: string
) {
  await sdk.collection.refresh(index, collection);
  await sdk.document.deleteByQuery(index, collection, {});
}

export async function beforeEachTruncateCollections (sdk: Kuzzle) {
  await Promise.all([
    truncateCollection(sdk, "device-manager", "devices"),
    truncateCollection(sdk, "device-manager", "payloads"),

    truncateCollection(sdk, "engine-kuzzle", "assets"),
    truncateCollection(sdk, "engine-kuzzle", "assets-history"),
    truncateCollection(sdk, "engine-kuzzle", "measures"),
    truncateCollection(sdk, "engine-kuzzle", "devices"),

    truncateCollection(sdk, "engine-ayse", "assets"),
    truncateCollection(sdk, "engine-ayse", "assets-history"),
    truncateCollection(sdk, "engine-ayse", "measures"),
    truncateCollection(sdk, "engine-ayse", "devices"),
  ]);
}