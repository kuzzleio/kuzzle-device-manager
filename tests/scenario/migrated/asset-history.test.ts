import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";

jest.setTimeout(10000);

describe("features/Asset/History", () => {
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

  it("Historize asset after creation and metadata update", async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-kuzzle",
      body: { model: "Container", reference: "A1", metadata: { height: 5 } },
    });

    response = await sdk.query({
      controller: "device-manager/assets",
      action: "update",
      engineId: "engine-kuzzle",
      _id: "Container-A1",
      body: { metadata: { weight: 1250 } },
    });

    await sdk.collection.refresh("engine-kuzzle", "assets-history");

    response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-kuzzle",
      collection: "assets-history",
      body: { sort: { "_kuzzle_info.createdAt": "desc" } },
    });

    expect(response.result).toMatchObject({
      hits: {
        "0": {
          _source: {
            id: "Container-A1",
            event: { name: "metadata", metadata: { names: ["weight"] } },
            asset: { metadata: { height: 5, weight: 1250 } },
          },
        },
        "1": {
          _source: {
            id: "Container-A1",
            event: {
              name: "metadata",
              metadata: { names: ["weight", "height", "trailer"] },
            },
            asset: { metadata: { height: 5, weight: null } },
          },
        },
        length: 2,
      },
    });
  });

  it("Historize asset after being linked and unlinked", async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: "device-manager/devices",
      action: "linkAsset",
      _id: "DummyTemp-unlinked1",
      assetId: "Container-unlinked1",
      engineId: "engine-ayse",
      body: {
        measureNames: [{ device: "temperature", asset: "temperatureExt" }],
      },
    });

    response = await sdk.query({
      controller: "device-manager/devices",
      action: "unlinkAsset",
      engineId: "engine-ayse",
      _id: "DummyTemp-unlinked1",
    });

    await sdk.collection.refresh("engine-ayse", "assets-history");

    response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "assets-history",
      body: { sort: { "_kuzzle_info.createdAt": "desc" } },
    });

    expect(response.result).toMatchObject({
      hits: {
        "0": {
          _source: {
            id: "Container-unlinked1",
            event: {
              name: "unlink",
              unlink: { deviceId: "DummyTemp-unlinked1" },
            },
            asset: { linkedDevices: [] },
          },
        },
        "1": {
          _source: {
            id: "Container-unlinked1",
            event: { name: "link", link: { deviceId: "DummyTemp-unlinked1" } },
            asset: { linkedDevices: [{ _id: "DummyTemp-unlinked1" }] },
          },
        },
        length: 2,
      },
    });
  });

  it("Historize asset after receiving a new measure", async () => {
    let response;
    let promise;

    response = await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "linked1", temperature: 42.2 },
    ]);

    await sdk.collection.refresh("engine-ayse", "assets-history");

    response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "assets-history",
      body: { sort: { "_kuzzle_info.createdAt": "desc" } },
    });

    expect(response.result).toMatchObject({
      hits: {
        "0": {
          _source: {
            id: "Container-linked1",
            event: { name: "measure", measure: { names: ["temperatureExt"] } },
            asset: {
              measures: { temperatureExt: { values: { temperature: 42.2 } } },
            },
          },
        },
        length: 1,
      },
    });
  });

  it("Historize asset when metadata have been updated when receiving a measure", async () => {
    let response;
    let promise;

    response = await sendPayloads(sdk, "dummy-temp", [
      {
        deviceEUI: "linked1",
        temperature: 42.2,
        metadata: { color: "test-metadata-history-with-measure" },
      },
    ]);

    await sdk.collection.refresh("engine-ayse", "assets-history");

    response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "assets-history",
      body: { sort: { "_kuzzle_info.createdAt": "desc" } },
    });

    expect(response.result).toMatchObject({
      hits: {
        "0": {
          _source: {
            id: "Container-linked1",
            event: {
              name: "measure",
              measure: { names: ["temperatureExt"] },
              metadata: { names: ["weight", "trailer.capacity"] },
            },
            asset: {
              measures: { temperatureExt: { values: { temperature: 42.2 } } },
              metadata: { weight: 42042 },
            },
          },
        },
        length: 1,
      },
    });
  });
});
