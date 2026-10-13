import { useSdk } from "../../../helpers";
import { beforeEachTruncateCollections } from "../../../hooks/collections";
import { beforeAllCreateEngines } from "../../../hooks/engines";
import { beforeEachLoadFixtures } from "../../../hooks/fixtures";

describe("AssetsController:migrateTenant", () => {
  const sdk = useSdk();

  beforeAll(async () => {
    await sdk.connect();

    await beforeAllCreateEngines(sdk);

    await sdk.auth.login("local", {
      username: "test-admin",
      password: "password",
    });
  });

  beforeEach(async () => {
    await beforeEachTruncateCollections(sdk);
    await beforeEachLoadFixtures(sdk);
  });

  afterAll(async () => {
    sdk.disconnect();
  });

  it("should fail if both engine does not belong to same group", async () => {
    await expect(
      sdk.query({
        controller: "device-manager/assets",
        action: "migrateTenant",
        index: "engine-ayse",
        body: {
          assetsList: ["Container-linked1", "Container-linked2"],
          newIndex: "engine-other-group",
        },
      }),
    ).rejects.toThrow(
      "Engine engine-other-group is not in the same group as engine-ayse",
    );
  });

  it("should fail if no assets are provided", async () => {
    await expect(
      sdk.query({
        controller: "device-manager/assets",
        action: "migrateTenant",
        index: "engine-ayse",
        body: { assetsList: [], newIndex: "engine-kuzzle" },
      }),
    ).rejects.toThrow("No assets to migrate");
  });

  it("should fail if all provided assets already exist in the new tenant", async () => {
    await sdk.query({
      controller: "device-manager/assets",
      action: "create",
      index: "engine-kuzzle",
      body: { model: "Container", reference: "linked1" },
    });

    await sdk.collection.refresh("engine-kuzzle", "assets");

    await expect(
      sdk.query({
        controller: "device-manager/assets",
        action: "migrateTenant",
        index: "engine-ayse",
        body: {
          assetsList: ["Container-linked1"],
          newIndex: "engine-kuzzle",
        },
      }),
    ).rejects.toThrow(
      "All assets to migrate already exists in destination tenant.",
    );
  });

  it("should copy 1 of 2 assets from engine-ayse to engine-kuzzle", async () => {
    await sdk.query({
      controller: "device-manager/assets",
      action: "create",
      index: "engine-kuzzle",
      body: { model: "Container", reference: "linked1" },
    });

    await sdk.collection.refresh("engine-kuzzle", "assets");

    const response = await sdk.query({
      controller: "device-manager/assets",
      action: "migrateTenant",
      index: "engine-ayse",
      body: {
        assetsList: ["Container-linked1", "Container-linked2"],
        newIndex: "engine-kuzzle",
      },
    });

    await sdk.collection.refresh("engine-kuzzle", "assets");

    const assets = await sdk.query({
      controller: "device-manager/assets",
      action: "search",
      index: "engine-kuzzle",
      body: { query: { equals: { model: "Container" } } },
      lang: "koncorde",
    });

    expect(response.status).toBe(200);
    expect(assets.result.hits).toHaveLength(2);
  });

  it("should copy all assets from engine-ayse to engine-kuzzle", async () => {
    const response = await sdk.query({
      controller: "device-manager/assets",
      action: "migrateTenant",
      index: "engine-ayse",
      body: {
        assetsList: ["Container-linked1", "Container-linked2"],
        newIndex: "engine-kuzzle",
      },
    });

    await sdk.collection.refresh("engine-kuzzle", "assets");

    const assets = await sdk.query({
      controller: "device-manager/assets",
      action: "search",
      index: "engine-kuzzle",
      body: { query: { equals: { model: "Container" } } },
      lang: "koncorde",
    });

    expect(response.status).toBe(200);
    expect(assets.result.hits).toHaveLength(2);
  });
  it("should fail if the user is not an admin", async () => {
    await sdk.auth.login("local", {
      username: "default-user",
      password: "password",
    });
    await expect(
      sdk.query({
        controller: "device-manager/assets",
        action: "migrateTenant",
        index: "engine-ayse",
        body: {
          assetsList: ["Container-linked1", "Container-linked2"],
          newIndex: "engine-kuzzle",
        },
      }),
    ).rejects.toThrow("User default-user is not authorized to migrate assets");
  });
});
