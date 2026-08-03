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
      (model) => model._source.name === "battery-as-temp",
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
          sourceField: "battery",
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
          sourceField: "temperature",
        },
      }),
    ).rejects.toThrow();
  });

  it("Should apply a measure adapter on a device's raw measure before enrichment, tracing the original measure in origin.adapter", async () => {
    const listResponse = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasureAdapters",
      engineId: "engine-ayse",
    });
    const measureAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "battery-as-temp",
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
        sourceField: "battery",
      },
    });

    const deviceResponse = await sdk.query({
      controller: "device-manager/devices",
      action: "get",
      engineId: "engine-ayse",
      _id: "DummyTemp-adapter_me_master",
    });

    expect(deviceResponse.result._source.measureSlots).toEqual(
      expect.arrayContaining([{ name: "temp", type: "temperature" }]),
    );
    expect(deviceResponse.result._source.measureSlots).not.toEqual(
      expect.arrayContaining([{ name: "battery", type: "battery" }]),
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
              { term: { "origin.measureName": "temp" } },
            ],
          },
        },
      },
    });

    expect(response.result).toMatchObject({
      hits: [
        {
          _source: {
            type: "temperature",
            values: { temperature: 55 },
            origin: {
              measureName: "temp",
              adapter: {
                _id: measureAdapterId,
                name: "battery-as-temp",
                sourceMeasureName: "battery",
                sourceType: "battery",
                sourceField: "battery",
                sourceValues: { battery: 55 },
                targetField: "temperature",
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
    const nestedTargetAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "battery-as-envquality-humidity",
    )._id;
    const nestedSourceAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "multisensor-as-temp",
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
        measureAdapterId: nestedTargetAdapterId,
        sourceMeasureName: "battery",
        sourceField: "battery",
      },
    });

    await sdk.query({
      controller: "device-manager/devices",
      action: "setMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-nested_adapter_master",
      body: {
        measureAdapterId: nestedSourceAdapterId,
        sourceMeasureName: "multiSensor",
        sourceField: "readings.ch1",
      },
    });

    await sendPayloads(sdk, "dummy-temp", [
      {
        deviceEUI: "nested_adapter_master",
        temperature: 19,
        battery: 42,
        multiSensor: { ch1: 27.5, ch2: 99 },
      },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "measures",
      body: {
        query: { term: { "origin.reference": "nested_adapter_master" } },
      },
    });

    const hitsByMeasureName = Object.fromEntries(
      response.result.hits.map((hit) => [
        hit._source.origin.measureName,
        hit._source,
      ]),
    );

    expect(hitsByMeasureName.envQualityFromBattery).toMatchObject({
      type: "environmentalQuality",
      values: { envQuality: { humidity: 42 } },
      origin: {
        adapter: {
          name: "battery-as-envquality-humidity",
          sourceField: "battery",
          targetField: "envQuality.humidity",
        },
      },
    });

    expect(hitsByMeasureName.tempFromMultiSensor).toMatchObject({
      type: "temperature",
      values: { temperature: 27.5 },
      origin: {
        adapter: {
          name: "multisensor-as-temp",
          sourceField: "readings.ch1",
          targetField: "temperature",
        },
      },
    });
  });

  it("Should allow several measure adapters on the same source measure slot at once", async () => {
    const listResponse = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasureAdapters",
      engineId: "engine-ayse",
    });
    const ch1AdapterId = listResponse.result.models.find(
      (model) => model._source.name === "multisensor-as-temp",
    )._id;
    const ch2AdapterId = listResponse.result.models.find(
      (model) => model._source.name === "multisensor-as-envquality-co2",
    )._id;

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "multi_adapter_master" },
    });

    await sdk.query({
      controller: "device-manager/devices",
      action: "setMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-multi_adapter_master",
      body: {
        measureAdapterId: ch1AdapterId,
        sourceMeasureName: "multiSensor",
        sourceField: "readings.ch1",
      },
    });

    let deviceResponse = await sdk.query({
      controller: "device-manager/devices",
      action: "setMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-multi_adapter_master",
      body: {
        measureAdapterId: ch2AdapterId,
        sourceMeasureName: "multiSensor",
        sourceField: "readings.ch2",
      },
    });

    expect(deviceResponse.result._source.measureAdapters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceMeasureName: "multiSensor",
          measureAdapterId: ch1AdapterId,
        }),
        expect.objectContaining({
          sourceMeasureName: "multiSensor",
          measureAdapterId: ch2AdapterId,
        }),
      ]),
    );
    expect(deviceResponse.result._source.measureSlots).toEqual(
      expect.arrayContaining([
        { name: "tempFromMultiSensor", type: "temperature" },
        { name: "co2FromMultiSensor", type: "environmentalQuality" },
      ]),
    );
    expect(deviceResponse.result._source.measureSlots).not.toEqual(
      expect.arrayContaining([
        { name: "multiSensor", type: "multiSensorRaw" },
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

    expect(hitsByMeasureName.tempFromMultiSensor).toMatchObject({
      type: "temperature",
      values: { temperature: 12.5 },
      origin: { adapter: { name: "multisensor-as-temp", sourceField: "readings.ch1" } },
    });
    expect(hitsByMeasureName.co2FromMultiSensor).toMatchObject({
      type: "environmentalQuality",
      values: { envQuality: { co2: 77 } },
      origin: { adapter: { name: "multisensor-as-envquality-co2", sourceField: "readings.ch2" } },
    });

    deviceResponse = await sdk.query({
      controller: "device-manager/devices",
      action: "unsetMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-multi_adapter_master",
      body: { measureAdapterId: ch2AdapterId, sourceMeasureName: "multiSensor" },
    });

    expect(deviceResponse.result._source.measureAdapters).toEqual([
      expect.objectContaining({
        sourceMeasureName: "multiSensor",
        measureAdapterId: ch1AdapterId,
      }),
    ]);
    expect(deviceResponse.result._source.measureSlots).toEqual(
      expect.arrayContaining([
        { name: "tempFromMultiSensor", type: "temperature" },
      ]),
    );
    expect(deviceResponse.result._source.measureSlots).not.toEqual(
      expect.arrayContaining([
        { name: "co2FromMultiSensor", type: "environmentalQuality" },
      ]),
    );
  });

  it("Should reject a second measure adapter that would produce a targetMeasureName already used on the device, unless a distinct targetMeasureName override is provided", async () => {
    const listResponse = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasureAdapters",
      engineId: "engine-ayse",
    });
    const batteryAsTempId = listResponse.result.models.find(
      (model) => model._source.name === "battery-as-temp",
    )._id;
    const conflictingAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "multisensor-as-temp-conflict",
    )._id;

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "colliding_adapter_master" },
    });

    await sdk.query({
      controller: "device-manager/devices",
      action: "setMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-colliding_adapter_master",
      body: {
        measureAdapterId: batteryAsTempId,
        sourceMeasureName: "battery",
        sourceField: "battery",
      },
    });

    await expect(
      sdk.query({
        controller: "device-manager/devices",
        action: "setMeasureAdapter",
        engineId: "engine-ayse",
        _id: "DummyTemp-colliding_adapter_master",
        body: {
          measureAdapterId: conflictingAdapterId,
          sourceMeasureName: "multiSensor",
          sourceField: "readings.ch1",
        },
      }),
    ).rejects.toThrow();

    const deviceResponse = await sdk.query({
      controller: "device-manager/devices",
      action: "setMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-colliding_adapter_master",
      body: {
        measureAdapterId: conflictingAdapterId,
        sourceMeasureName: "multiSensor",
        sourceField: "readings.ch1",
        targetMeasureName: "temp2",
      },
    });

    expect(deviceResponse.result._source.measureSlots).toEqual(
      expect.arrayContaining([
        { name: "temp", type: "temperature" },
        { name: "temp2", type: "temperature" },
      ]),
    );

    await sendPayloads(sdk, "dummy-temp", [
      {
        deviceEUI: "colliding_adapter_master",
        temperature: 19,
        battery: 61,
        multiSensor: { ch1: 33.3, ch2: 1 },
      },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "measures",
      body: {
        query: { term: { "origin.reference": "colliding_adapter_master" } },
      },
    });

    const hitsByMeasureName = Object.fromEntries(
      response.result.hits.map((hit) => [
        hit._source.origin.measureName,
        hit._source,
      ]),
    );

    expect(hitsByMeasureName.temp).toMatchObject({
      values: { temperature: 61 },
    });
    expect(hitsByMeasureName.temp2).toMatchObject({
      values: { temperature: 33.3 },
    });
  });

  it("Should reject a sourceField that is not declared in the source measure's valuesMappings", async () => {
    const listResponse = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasureAdapters",
      engineId: "engine-ayse",
    });
    const measureAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "multisensor-as-temp",
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
          sourceField: "readings.doesNotExist",
        },
      }),
    ).rejects.toThrow();
  });

  it("Should allow the same measure adapter definition to be reused across different devices with different sourceFields", async () => {
    const listResponse = await sdk.query({
      controller: "device-manager/models",
      action: "listMeasureAdapters",
      engineId: "engine-ayse",
    });
    const measureAdapterId = listResponse.result.models.find(
      (model) => model._source.name === "multisensor-as-temp",
    )._id;

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "reuse_device_ch1" },
    });
    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: { model: "DummyTemp", reference: "reuse_device_ch2" },
    });

    await sdk.query({
      controller: "device-manager/devices",
      action: "setMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-reuse_device_ch1",
      body: {
        measureAdapterId,
        sourceMeasureName: "multiSensor",
        sourceField: "readings.ch1",
      },
    });
    await sdk.query({
      controller: "device-manager/devices",
      action: "setMeasureAdapter",
      engineId: "engine-ayse",
      _id: "DummyTemp-reuse_device_ch2",
      body: {
        measureAdapterId,
        sourceMeasureName: "multiSensor",
        sourceField: "readings.ch2",
      },
    });

    await sendPayloads(sdk, "dummy-temp", [
      {
        deviceEUI: "reuse_device_ch1",
        temperature: 19,
        multiSensor: { ch1: 44.4, ch2: 5 },
      },
      {
        deviceEUI: "reuse_device_ch2",
        temperature: 19,
        multiSensor: { ch1: 5, ch2: 66.6 },
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
              { term: { "origin.measureName": "tempFromMultiSensor" } },
              {
                terms: {
                  "origin.reference": ["reuse_device_ch1", "reuse_device_ch2"],
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

    expect(hitsByReference.reuse_device_ch1).toMatchObject({
      values: { temperature: 44.4 },
      origin: { adapter: { sourceField: "readings.ch1" } },
    });
    expect(hitsByReference.reuse_device_ch2).toMatchObject({
      values: { temperature: 66.6 },
      origin: { adapter: { sourceField: "readings.ch2" } },
    });
  });
});
