import { Kuzzle } from "kuzzle-sdk";

export async function truncateCollection(
  sdk: Kuzzle,
  index: string,
  collection: string,
) {
  await sdk.collection.refresh(index, collection);
  await sdk.document.deleteByQuery(index, collection, {});
}

async function deleteModels(sdk: Kuzzle) {
  await sdk.collection.refresh("device-manager", "models");
  await sdk.document.deleteByQuery("device-manager", "models", {
    query: {
      ids: {
        values: [
          "model-measure-presence",
          "model-asset-plane",
          "model-asset-AdvancedPlane",
          "model-device-Zigbee",
          "model-device-Enginko",
          "model-asset-AdvancedWarehouse",
        ],
      },
    },
  });
}

export async function beforeEachTruncateCollections(sdk: Kuzzle) {
  await Promise.all([
    truncateCollection(sdk, "device-manager", "devices"),
    truncateCollection(sdk, "device-manager", "payloads"),

    truncateCollection(sdk, "engine-kuzzle", "assets"),
    truncateCollection(sdk, "engine-kuzzle", "assets-history"),
    truncateCollection(sdk, "engine-kuzzle", "assets-groups"),
    truncateCollection(sdk, "engine-kuzzle", "measures"),
    truncateCollection(sdk, "engine-kuzzle", "devices"),

    truncateCollection(sdk, "engine-ayse", "assets"),
    truncateCollection(sdk, "engine-ayse", "assets-history"),
    truncateCollection(sdk, "engine-ayse", "assets-groups"),
    truncateCollection(sdk, "engine-ayse", "measures"),
    truncateCollection(sdk, "engine-ayse", "devices"),

    truncateCollection(sdk, "engine-other-group", "assets"),
    truncateCollection(sdk, "engine-other-group", "assets-history"),
    truncateCollection(sdk, "engine-other-group", "assets-groups"),
    truncateCollection(sdk, "engine-other-group", "measures"),
    truncateCollection(sdk, "engine-other-group", "devices"),

    deleteModels(sdk),
  ]);
}
