import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";

jest.setTimeout(10000);

describe("features/Asset/Controller", () => {
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

  it("SCRUD asset", async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-kuzzle",
      body: { model: "Container", reference: "A1", metadata: { height: 5 } },
    });

    await expect(
      sdk.document.get("engine-kuzzle", "assets", "Container-A1")
    ).resolves.toMatchObject({
      _source: {
        metadata: { height: 5, weight: null },
        measures: {
          temperatureExt: null,
          temperatureInt: null,
          position: null,
        },
        linkedDevices: [],
        _kuzzle_info: { author: "-1" },
      },
    });

    response = await sdk.query({
      controller: "device-manager/assets",
      action: "update",
      engineId: "engine-kuzzle",
      _id: "Container-A1",
      body: { metadata: { weight: 1250 } },
    });

    await expect(
      sdk.document.get("engine-kuzzle", "assets", "Container-A1")
    ).resolves.toMatchObject({
      _source: {
        metadata: { height: 5, weight: 1250 },
        _kuzzle_info: { updater: "-1" },
      },
    });

    response = await sdk.query({
      controller: "device-manager/assets",
      action: "get",
      engineId: "engine-kuzzle",
      _id: "Container-A1",
    });

    expect(response.result).toMatchObject({
      _source: { metadata: { height: 5 }, reference: "A1" },
    });

    response = await sdk.query({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-kuzzle",
      body: { model: "Container", reference: "B2" },
    });

    await sdk.collection.refresh("engine-kuzzle", "assets");

    response = await sdk.query({
      controller: "device-manager/assets",
      action: "search",
      engineId: "engine-kuzzle",
      body: { query: { equals: { reference: "A1" } } },
      size: 1,
      lang: "koncorde",
    });

    expect(response.result.hits[0]).toMatchObject({ _id: "Container-A1" });

    response = await sdk.query({
      controller: "device-manager/assets",
      action: "delete",
      engineId: "engine-kuzzle",
      _id: "Container-A1",
    });

    await expect(
      sdk.document.exists("engine-kuzzle", "assets", "Container-A1")
    ).resolves.toBe(false);
  });

  it("Error when creating Asset from unknown model", async () => {
    let response;
    let promise;

    promise = sdk.query({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-kuzzle",
      body: { model: "truck", reference: "BX98HZ" },
    });

    await expect(promise).rejects.toMatchObject({
      message: 'Unknown Asset model "truck".',
    });
  });

  it("Update linked device when deleting asset", async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: "device-manager/assets",
      action: "delete",
      engineId: "engine-ayse",
      _id: "Container-linked1",
    });

    await expect(
      sdk.document.exists("engine-ayse", "assets", "Container-linked1")
    ).resolves.toBe(false);

    await expect(
      sdk.document.get("device-manager", "devices", "DummyTemp-linked1")
    ).resolves.toMatchObject({
      _source: { assetId: null },
    });

    await expect(
      sdk.document.get("engine-ayse", "devices", "DummyTemp-linked1")
    ).resolves.toMatchObject({
      _source: { assetId: null },
    });
  });

  it("Create asset from backend side", async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: "tests",
      action: "createDigitalTwinFromBackend",
      engineId: "engine-kuzzle",
      body: { reference: "foobar" },
    });

    await expect(
      sdk.document.exists("engine-kuzzle", "assets", "Container-foobar")
    ).resolves.toBe(true);

    await expect(
      sdk.document.exists("engine-kuzzle", "devices", "DummyTemp-foobar")
    ).resolves.toBe(true);
  });
});
