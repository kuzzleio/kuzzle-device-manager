import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";
import { ApiDeviceLinkAssetsRequest } from "lib/modules/device";

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

    response = await sdk.query<ApiDeviceLinkAssetsRequest>({
      controller: "device-manager/devices",
      action: "linkAssets",
      _id: "DummyTemp-enrich_me_master",
      engineId: "engine-ayse",
      body: {
        linkedMeasures: [
          {
            assetId: "Container-unlinked1",
            measureSlots: [{ device: "temperature", asset: "temperatureExt" }],
          },
        ],
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
  });

  it("Additional computed measures should be added automatically to the digital twin last measures", async () => {
    let response = await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "compute_me_master" },
    });

    response = await sdk.query<ApiDeviceLinkAssetsRequest>({
      controller: "device-manager/devices",
      action: "linkAssets",
      _id: "DummyTemp-compute_me_master",
      engineId: "engine-ayse",
      body: {
        linkedMeasures: [
          {
            assetId: "Container-unlinked1",
            measureSlots: [{ device: "temperature", asset: "temperatureExt" }],
          },
        ],
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

    const lastMeasuresResponse = await sdk.query({
      controller: "device-manager/assets",
      action: "getLastMeasures",
      engineId: "engine-ayse",
      _id: "Container-unlinked1",
      measureCount: 2,
    });

    expect(lastMeasuresResponse.result).toMatchObject({
      temperatureExt: { values: { temperature: 20 } },
      temperatureInt: { values: { temperature: 40 } },
    });
  });

  it("Should enrich measure with the origin device metadata", async () => {
    const metadata = { color: "blue" };

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: {
        model: "DummyTemp",
        reference: "meta_device",
        metadata: metadata,
      },
    });

    await sdk.query<ApiDeviceLinkAssetsRequest>({
      controller: "device-manager/devices",
      action: "linkAssets",
      _id: "DummyTemp-meta_device",
      engineId: "engine-ayse",
      body: {
        linkedMeasures: [
          {
            assetId: "Container-unlinked1",
            measureSlots: [{ device: "temperature", asset: "temperatureExt" }],
          },
        ],
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
        {
          _source: {
            type: "temperature",
            values: { temperature: 35 },
            origin: { deviceMetadata: metadata },
          },
        },
        {
          _source: {
            type: "temperature",
            values: { temperature: 25 },
            origin: { deviceMetadata: metadata },
          },
        },
      ],
    });
  });

  it("Should enrich measure with the origin device groups", async () => {
    await sendPayloads(sdk, "dummy-temp-position", [
      { deviceEUI: "linked2", temperature: 35, location: { lon: 12, lat: 12 } },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "measures",
      body: { query: { term: { "origin.reference": "linked2" } } },
    });

    expect(response.result.hits[0]._source.origin.groups[0]).toMatchObject({
      path: "test-parent-asset",
    });
  });

  it("Should reject assigning a measure adapter to a measure slot with a mismatched type", async () => {
    const listResponse = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasureAdapters",
      engineId: "engine-ayse",
    });
    const measureAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "battery-as-humidity",
    )._id;

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "invalid_adapter_slot" },
    });

    await expect(
      sdk.query({
        controller: "device-manager/devices",
        action: "setMeasureAdapter",
        engineId: "engine-ayse",
        _id: "DummyTemp-invalid_adapter_slot",
        body: {
          measureAdapterId,
          sourceMeasureName: "temperature",
        },
      }),
    ).rejects.toThrow();
  });

  it("Should reject a measure adapter whose source measure is not scope \"device\" or whose target measure is not scope \"asset\"", async () => {
    const listResponse = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasureAdapters",
      engineId: "engine-ayse",
    });
    const measureAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "temp-as-battery-invalid-scope",
    )._id;

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "invalid_scope_slot" },
    });

    await expect(
      sdk.query({
        controller: "device-manager/devices",
        action: "setMeasureAdapter",
        engineId: "engine-ayse",
        _id: "DummyTemp-invalid_scope_slot",
        body: {
          measureAdapterId,
          sourceMeasureName: "temperature",
        },
      }),
    ).rejects.toThrow();
  });

  it("Should apply a measure adapter on a device's raw measure, keeping the measure slot and tracing the original raw measure in origin.measureAdaption", async () => {
    const listResponse = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasureAdapters",
      engineId: "engine-ayse",
    });
    const measureAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "battery-as-humidity",
    )._id;

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "adapter_me_master" },
    });

    await sdk.query({
      controller: "device-manager/devices",
      action: "setMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-adapter_me_master",
      body: {
        measureAdapterId,
        sourceMeasureName: "battery",
      },
    });

    const deviceResponse = await sdk.query({
      controller: "device-manager/devices",
      action: "get",
      engineId: "engine-ayse",
      _id: "DummyTemp-adapter_me_master",
    });

    expect(deviceResponse.result._source.measureSlots).toEqual(
      expect.arrayContaining([
        { name: "battery", type: "battery", measureAdapter: "battery-as-humidity" },
      ]),
    );

    await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "adapter_me_master", temperature: 19, battery: 55 },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "measures",
      body: {
        query: {
          bool: {
            must: [
              { term: { "origin.reference": "adapter_me_master" } },
              { term: { "origin.measureName": "humidity" } },
            ],
          },
        },
      },
    });

    expect(response.result).toMatchObject({
      hits: [
        {
          _source: {
            type: "humidity",
            values: { humidity: 55 },
            origin: {
              measureName: "humidity",
              measureAdaption: {
                adaptor: "battery-as-humidity",
                rawMeasure: { battery: 55 },
              },
            },
          },
        },
      ],
    });
  });

  it("Should apply measure adapters with nested source/target fields (dot-notation)", async () => {
    const listResponse = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasureAdapters",
      engineId: "engine-ayse",
    });
    const measureAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "battery-as-envquality-humidity",
    )._id;

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "nested_adapter_master" },
    });

    await sdk.query({
      controller: "device-manager/devices",
      action: "setMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-nested_adapter_master",
      body: {
        measureAdapterId,
        sourceMeasureName: "battery",
      },
    });

    await sendPayloads(sdk, "dummy-temp", [
      {
        deviceEUI: "nested_adapter_master",
        temperature: 19,
        battery: 42,
      },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "measures",
      body: {
        query: {
          bool: {
            must: [
              { term: { "origin.reference": "nested_adapter_master" } },
              { term: { "origin.measureName": "environmentalQuality" } },
            ],
          },
        },
      },
    });

    expect(response.result).toMatchObject({
      hits: [
        {
          _source: {
            type: "environmentalQuality",
            values: { envQuality: { humidity: 42 } },
            origin: {
              measureAdaption: {
                adaptor: "battery-as-envquality-humidity",
                rawMeasure: { battery: 42 },
              },
            },
          },
        },
      ],
    });
  });

  it("Should fan out a single measure adapter into several target measures from one source slot", async () => {
    const listResponse = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasureAdapters",
      engineId: "engine-ayse",
    });
    const measureAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "multisensor-as-humidity-and-co2",
    )._id;

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "multi_adapter_master" },
    });

    const deviceResponse = await sdk.query({
      controller: "device-manager/devices",
      action: "setMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-multi_adapter_master",
      body: {
        measureAdapterId,
        sourceMeasureName: "multiSensor",
      },
    });

    expect(deviceResponse.result._source.measureSlots).toEqual(
      expect.arrayContaining([
        {
          name: "multiSensor",
          type: "multiSensorRaw",
          measureAdapter: "multisensor-as-humidity-and-co2",
        },
      ]),
    );

    await sendPayloads(sdk, "dummy-temp", [
      {
        deviceEUI: "multi_adapter_master",
        temperature: 19,
        multiSensor: { ch1: 12.5, ch2: 77 },
      },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "measures",
      body: {
        query: { term: { "origin.reference": "multi_adapter_master" } },
      },
    });

    const hitsByMeasureName = Object.fromEntries(
      response.result.hits.map((hit) => [
        hit._source.origin.measureName,
        hit._source,
      ]),
    );

    expect(hitsByMeasureName.humidity).toMatchObject({
      type: "humidity",
      values: { humidity: 12.5 },
      origin: {
        measureAdaption: {
          adaptor: "multisensor-as-humidity-and-co2",
          rawMeasure: { readings: { ch1: 12.5, ch2: 77 } },
        },
      },
    });
    expect(hitsByMeasureName.co2).toMatchObject({
      type: "co2",
      values: { co2: 77 },
      origin: {
        measureAdaption: {
          adaptor: "multisensor-as-humidity-and-co2",
          rawMeasure: { readings: { ch1: 12.5, ch2: 77 } },
        },
      },
    });
  });

  it("Should stop adapting a measure once the adapter is unset from its slot", async () => {
    const listResponse = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasureAdapters",
      engineId: "engine-ayse",
    });
    const measureAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "battery-as-humidity",
    )._id;

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "unset_adapter_master" },
    });

    await sdk.query({
      controller: "device-manager/devices",
      action: "setMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-unset_adapter_master",
      body: {
        measureAdapterId,
        sourceMeasureName: "battery",
      },
    });

    const deviceResponse = await sdk.query({
      controller: "device-manager/devices",
      action: "unsetMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-unset_adapter_master",
      body: { sourceMeasureName: "battery" },
    });

    expect(deviceResponse.result._source.measureSlots).toEqual(
      expect.arrayContaining([{ name: "battery", type: "battery" }]),
    );

    await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "unset_adapter_master", temperature: 19, battery: 55 },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "measures",
      body: {
        query: { term: { "origin.reference": "unset_adapter_master" } },
      },
    });

    const measureNames = response.result.hits.map(
      (hit) => hit._source.origin.measureName,
    );

    expect(measureNames).toContain("battery");
    expect(measureNames).not.toContain("humidity");
  });

  it("Should reject a fieldMapping source that is not declared in the source measure's valuesMappings", async () => {
    const listResponse = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasureAdapters",
      engineId: "engine-ayse",
    });
    const measureAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "multisensor-as-temp-invalid-field",
    )._id;

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "invalid_source_field" },
    });

    await expect(
      sdk.query({
        controller: "device-manager/devices",
        action: "setMeasureAdapter",
        engineId: "engine-ayse",
        _id: "DummyTemp-invalid_source_field",
        body: {
          measureAdapterId,
          sourceMeasureName: "multiSensor",
        },
      }),
    ).rejects.toThrow();
  });

  it("Should allow the same measure adapter definition to be reused across different devices", async () => {
    const listResponse = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasureAdapters",
      engineId: "engine-ayse",
    });
    const measureAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "battery-as-humidity",
    )._id;

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "reuse_device_a" },
    });
    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "reuse_device_b" },
    });

    await sdk.query({
      controller: "device-manager/devices",
      action: "setMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-reuse_device_a",
      body: { measureAdapterId, sourceMeasureName: "battery" },
    });
    await sdk.query({
      controller: "device-manager/devices",
      action: "setMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-reuse_device_b",
      body: { measureAdapterId, sourceMeasureName: "battery" },
    });

    await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "reuse_device_a", temperature: 19, battery: 44 },
      { deviceEUI: "reuse_device_b", temperature: 19, battery: 66 },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "measures",
      body: {
        query: {
          bool: {
            must: [
              { term: { "origin.measureName": "humidity" } },
              {
                terms: {
                  "origin.reference": ["reuse_device_a", "reuse_device_b"],
                },
              },
            ],
          },
        },
      },
    });

    const hitsByReference = Object.fromEntries(
      response.result.hits.map((hit) => [
        hit._source.origin.reference,
        hit._source,
      ]),
    );

    expect(hitsByReference.reuse_device_a).toMatchObject({
      values: { humidity: 44 },
    });
    expect(hitsByReference.reuse_device_b).toMatchObject({
      values: { humidity: 66 },
    });
  });
});
