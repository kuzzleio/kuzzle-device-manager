import { AssetHistoryContent } from "../../../../index";

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

  it("should add a metadata event to the history entry", async () => {
    await sendDummyTempPayloads(sdk, [
      {
        deviceEUI: "linked1",
        temperature: 21,
        metadata: {
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
});
