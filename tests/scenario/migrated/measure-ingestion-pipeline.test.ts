import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";

jest.setTimeout(10000);

describe("features/Measure/IngestionPipeline", () => {
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

  it("Enrich a measure for a device linked to an asset with asset info", async () => {
    let response = await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "enrich_me_master" },
    });

    response = await sdk.query({
      controller: "device-manager/devices",
      action: "linkAsset",
      _id: "DummyTemp-enrich_me_master",
      assetId: "Container-unlinked1",
      engineId: "engine-ayse",
      body: {
        measureNames: [{ device: "temperature", asset: "temperatureExt" }],
      },
    });

    response = await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "enrich_me_master", temperature: 18 },
      { deviceEUI: "enrich_me_master", temperature: 21 },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "measures",
      body: { query: { term: { "asset._id": "Container-unlinked1" } } },
    });

    expect(response.result).toMatchObject({
      hits: [
        { _source: { type: "temperature", values: { temperature: 36 } } },
        { _source: { type: "temperature", values: { temperature: 42 } } },
      ],
    });

    await expect(
      sdk.query({
        _id: "DummyTemp-enrich_me_master",
        action: "getLastMeasures",
        controller: "device-manager/devices",
        engineId: "engine-ayse",
      })
    ).resolves.toMatchObject({
      result: {
        temperature: { values: { temperature: 42 } },
      },
    });

    await expect(
      sdk.query({
        _id: "Container-unlinked1",
        action: "getLastMeasures",
        controller: "device-manager/assets",
        engineId: "engine-ayse",
      })
    ).resolves.toMatchObject({
      result: {
        temperatureExt: { values: { temperature: 42 } },
      },
    });
  });

  it("Additional computed measures should be added automatically to the digital twin last measures", async () => {
    let response = await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "compute_me_master" },
    });

    response = await sdk.query({
      controller: "device-manager/devices",
      action: "linkAsset",
      _id: "DummyTemp-compute_me_master",
      assetId: "Container-unlinked1",
      engineId: "engine-ayse",
      body: {
        measureNames: [{ device: "temperature", asset: "temperatureExt" }],
      },
    });

    response = await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "compute_me_master", temperature: 20 },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "measures",
      body: { query: { term: { "asset.measureName": "temperatureInt" } } },
    });

    expect(response.result).toMatchObject({
      hits: [{ _source: { origin: { _id: "compute-temperature-int" } } }],
    });

    await expect(
      sdk.query({
        _id: "DummyTemp-compute_me_master",
        action: "getLastMeasures",
        controller: "device-manager/devices",
        engineId: "engine-ayse",
      })
    ).resolves.toMatchObject({
      result: {
        temperature: { values: { temperature: 20 } },
      },
    });

    await expect(
      sdk.query({
        _id: "Container-unlinked1",
        action: "getLastMeasures",
        controller: "device-manager/assets",
        engineId: "engine-ayse",
      })
    ).resolves.toMatchObject({
      result: {
        temperatureExt: { values: { temperature: 20 } },
        temperatureInt: { values: { temperature: 40 } },
      },
    });
  });

  it("Should enrich measure with the origin device metadata", async () => {
    const metadata = {
      color: "blue"
    }

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "meta_device", metadata: metadata},
    });

    await sdk.query({
      controller: "device-manager/devices",
      action: "linkAsset",
      _id: "DummyTemp-meta_device",
      assetId: "Container-unlinked1",
      engineId: "engine-ayse",
      body: {
        measureNames: [{ device: "temperature", asset: "temperatureExt" }],
      },
    });

    await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "meta_device", temperature: 35 },
      { deviceEUI: "meta_device", temperature: 25 },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "measures",
      body: { query: { term: { "asset._id": "Container-unlinked1" } } },
    });

    expect(response.result).toMatchObject({
      hits: [
        { _source: { type: "temperature", values: { temperature: 35 }, origin: { deviceMetadata: metadata} } },
        { _source: { type: "temperature", values: { temperature: 25 }, origin: { deviceMetadata: metadata} } },
      ],
    })
  })
});
