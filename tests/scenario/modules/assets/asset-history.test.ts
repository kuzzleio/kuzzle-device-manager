import { AssetContent, AssetHistoryContent } from "../../../../index";

import { sendDummyTempPayloads, setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("DeviceController: receiveMeasure", () => {
  const sdk = setupHooks();

  it("should save asset history when measure is received", async () => {
    await sendDummyTempPayloads(sdk, [
      {
        deviceEUI: "linked1",
        temperature: 21,
      },
    ]);
    await sdk.collection.refresh("engine-ayse", "assets-history");

    const result = await sdk.document.search<AssetHistoryContent>(
      "engine-ayse",
      "assets-history",
      {
        sort: { "_kuzzle_info.createdAt": "desc" },
      }
    );
    expect(result.hits[0]._source).toMatchObject({
      id: "Container-linked1",
      event: {
        name: "measure",
        measure: {
          names: ["temperatureExt"],
        },
      },
    });
    expect(result.hits[0]._source.event.metadata).toBeUndefined();
  });

  it("should historize asset for each measurements of the same measure received in non-chronological order", async () => {
    await sendDummyTempPayloads(sdk, [
      {
        measurements: [
          {
            deviceEUI: "linked1",
            temperature: 40.2,
            measuredAt: 1680096420000, // 1:27:00 PM UTC
          },
          {
            deviceEUI: "linked1",
            temperature: 41.2,
            measuredAt: 1680096360000, // 1:26:00 PM UTC
          },
          {
            deviceEUI: "linked1",
            temperature: 42.2,
            measuredAt: 1680096300000, // 1:25:00 PM UTC
          },
        ],
      },
    ]);
    await sdk.collection.refresh("engine-ayse", "assets-history");

    const result = await sdk.document.search<AssetHistoryContent>(
      "engine-ayse",
      "assets-history",
      { sort: { timestamp: "desc" } }
    );

    expect(result.hits).toHaveLength(3);
    expect(result.hits[0]._source).toMatchObject({
      id: "Container-linked1",
      event: {
        name: "measure",
        measure: {
          names: ["temperatureExt"],
        },
      },
      asset: {
        measures: { temperatureExt: { values: { temperature: 40.2 } } },
      },
    });
    expect(result.hits[1]._source).toMatchObject({
      id: "Container-linked1",
      event: {
        name: "measure",
        measure: {
          names: ["temperatureExt"],
        },
      },
      asset: {
        measures: { temperatureExt: { values: { temperature: 41.2 } } },
      },
    });
    expect(result.hits[2]._source).toMatchObject({
      id: "Container-linked1",
      event: {
        name: "measure",
        measure: {
          names: ["temperatureExt"],
        },
      },
      asset: {
        measures: { temperatureExt: { values: { temperature: 42.2 } } },
      },
    });
  });

  it("should add a metadata event to the history entry", async () => {
    await sendDummyTempPayloads(sdk, [
      {
        deviceEUI: "linked1",
        temperature: 21,
        metadata: {
          // Specify a string for test pipes (see in tests/application/tests/pipes.ts), add in metadata:
          //  weight = 42042;
          //  trailer.capacity = 2048;
          color: "test-metadata-history-with-measure",
        },
      },
    ]);
    await sdk.collection.refresh("engine-ayse", "assets-history");

    const result = await sdk.document.search<AssetHistoryContent>(
      "engine-ayse",
      "assets-history",
      {
        sort: { "_kuzzle_info.createdAt": "desc" },
      }
    );
    expect(result.hits[0]._source).toMatchObject({
      id: "Container-linked1",
      event: {
        name: "measure",
        measure: {
          names: ["temperatureExt"],
        },
        metadata: {
          names: ["weight", "trailer.capacity"],
        },
      },
    });
  });

  it("should add a metadata event to the history entry when update an asset", async () => {
    await sdk.query({
      controller: "device-manager/assets",
      action: "update",
      engineId: "engine-ayse",
      _id: "Container-linked1",
      body: {
        metadata: {
          trailer: {
            capacity: 1234,
            weight: 128,
          },
          person: {
            company: "Kuzzle",
          },
        },
      },
    });

    await sdk.collection.refresh("engine-ayse", "assets-history");

    const result = await sdk.document.search<AssetHistoryContent>(
      "engine-ayse",
      "assets-history",
      {
        sort: { "_kuzzle_info.createdAt": "desc" },
      }
    );

    expect(result.hits[0]._source).toMatchObject({
      id: "Container-linked1",
      event: {
        name: "metadata",
        metadata: {
          names: ["trailer.capacity", "trailer.weight", "person.company"],
        },
      },
    });

    await sdk.collection.refresh("engine-ayse", "assets");

    expect(
      (
        await sdk.document.get<AssetContent>(
          "engine-ayse",
          "assets",
          "Container-linked1"
        )
      )._source.metadata
    ).toMatchObject({
      height: 11,
      person: {
        company: "Kuzzle",
      },
      trailer: {
        capacity: 1234,
        weight: 128,
      },
    });
  });

  it("should add a metadata event to the history entry when create an asset", async () => {
    await sdk.query({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-ayse",
      body: {
        model: "Container",
        reference: "linked3",
        metadata: {
          trailer: {
            capacity: 1234,
            weight: 128,
          },
          person: {
            company: "Kuzzle",
          },
        },
      },
    });

    await sdk.collection.refresh("engine-ayse", "assets-history");

    const result = await sdk.document.search<AssetHistoryContent>(
      "engine-ayse",
      "assets-history",
      {
        sort: { "_kuzzle_info.createdAt": "desc" },
      }
    );

    // Update metadata from:  { weight: 10, height: 11, trailer: { weight: 128, capacity: 1024 } }
    // to:                    { trailer: { weight: 128, capacity: 1234 }, person: { company: 'Kuzzle' } }
    expect(result.hits[0]._source).toMatchObject({
      id: "Container-linked3",
      event: {
        name: "metadata",
        metadata: {
          names: [
            "weight",
            "height",
            "trailer.capacity",
            "trailer.weight",
            "person.company",
          ],
        },
      },
    });

    await sdk.collection.refresh("engine-ayse", "assets");

    expect(
      (
        await sdk.document.get<AssetContent>(
          "engine-ayse",
          "assets",
          "Container-linked3"
        )
      )._source.metadata
    ).toMatchObject({
      height: 20,
      person: {
        company: "Kuzzle",
      },
      trailer: {
        capacity: 1234,
        weight: 128,

      }
    });
  });

  it("should add a metadata event to the last history entry only if multiple measurements received", async () => {
    await sendDummyTempPayloads(sdk, [
      {
        measurements: [
          {
            deviceEUI: "linked1",
            temperature: 21,
            measuredAt: 1680096360000, // 1:26:00 PM UTC
            metadata: {
              color: "test-metadata-history-with-measure",
            },
          },
          {
            deviceEUI: "linked1",
            temperature: 42,
            measuredAt: 1680096420000, // 1:27:00 PM UTC
          },
        ],
      },
    ]);
    await sdk.collection.refresh("engine-ayse", "assets-history");

    const result = await sdk.document.search<AssetHistoryContent>(
      "engine-ayse",
      "assets-history",
      { sort: { timestamp: "desc" } }
    );

    expect(result.hits).toHaveLength(2);
    expect(result.hits[0]._source).toMatchObject({
      id: "Container-linked1",
      event: {
        name: "measure",
        measure: {
          names: ["temperatureExt"],
        },
        metadata: {
          names: ["weight", "trailer.capacity"],
        },
      },
      asset: {
        measures: { temperatureExt: { values: { temperature: 42 } } },
        metadata: { weight: 42042, trailer: { capacity: 2048 } },
      },
    });
    expect(result.hits[1]._source).toMatchObject({
      id: "Container-linked1",
      event: {
        name: "measure",
        measure: {
          names: ["temperatureExt"],
        },
      },
      asset: {
        measures: { temperatureExt: { values: { temperature: 21 } } },
        metadata: { weight: 10, trailer: { capacity: 1024 } },
      },
    });
  });
});
