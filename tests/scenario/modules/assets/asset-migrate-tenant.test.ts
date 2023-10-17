import { useSdk } from "../../../helpers";
import { beforeEachTruncateCollections } from "../../../hooks/collections";
import { beforeAllCreateEngines } from "../../../hooks/engines";
import { beforeEachLoadFixtures } from "../../../hooks/fixtures";

jest.setTimeout(10000);

describe("AssetsController:migrateTenant", () => {
  const sdk = useSdk();

  beforeAll(async () => {
    await sdk.connect();

    await beforeAllCreateEngines(sdk);
  });

  beforeEach(async () => {
    await beforeEachTruncateCollections(sdk);
    await beforeEachLoadFixtures(sdk);
  });

  afterAll(async () => {
    sdk.disconnect();
  });

  it("should fail if the user is not an admin", async () => {
    await expect(
      sdk.query({
        controller: "device-manager/assets",
        action: "migrateTenant",
        engineId: "engine-ayse",
        body: {
          assetsList: ["Container-linked1", "Container-linked2"],
          newEngineId: "engine-kuzzle",
        },
      })
    ).rejects.toThrow("User -1 is not authorized to migrate assets");
  });

  it("should fail if both engine does not belong to same group", async () => {
    // We connect only here to avoid failing the first test
    // If we do it in the beforeAll hook, the first test will fail
    // And if we run it each time we might encounter  "Too many login attempts per second"
    await sdk.auth.login("local", {
      username: "test-admin",
      password: "password",
    });

    await expect(
      sdk.query({
        controller: "device-manager/assets",
        action: "migrateTenant",
        engineId: "engine-ayse",
        body: {
          assetsList: ["Container-linked1", "Container-linked2"],
          newEngineId: "engine-other-group",
        },
      })
    ).rejects.toThrow(
      "Engine engine-other-group is not in the same group as engine-ayse"
    );
  });

  it("should fail if no assets are provided", async () => {
    await expect(
      sdk.query({
        controller: "device-manager/assets",
        action: "migrateTenant",
        engineId: "engine-ayse",
        body: {
          assetsList: [],
          newEngineId: "engine-kuzzle",
        },
      })
    ).rejects.toThrow("No assets to migrate");
  });

  it("should copy assets from engine-ayse to engine-kuzzle", async () => {
    const response = await sdk.query({
      controller: "device-manager/assets",
      action: "migrateTenant",
      engineId: "engine-ayse",
      body: {
        assetsList: ["Container-linked1", "Container-linked2"],
        newEngineId: "engine-kuzzle",
      },
    });

    await sdk.collection.refresh("engine-kuzzle", "assets");

    const assets = await sdk.query({
      controller: "device-manager/assets",
      action: "search",
      engineId: "engine-kuzzle",
      body: { query: { equals: { model: "Container" } } },
      lang: "koncorde",
    });

    const devices = await sdk.query({
      controller: "device-manager/assets",
      action: "search",
      engineId: "engine-kuzzle",
      body: { query: {} },
      lang: "koncorde",
    });

    expect(response.status).toBe(200);
    expect(assets.result.hits).toHaveLength(2);
    expect(devices.result.hits).toHaveLength(2);
  });
});
