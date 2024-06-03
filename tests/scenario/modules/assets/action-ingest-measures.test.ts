import { InternalCollection } from "../../../../lib/modules/plugin";
import {
  ApiAssetIngestMeasuresRequest,
  ApiAssetIngestMeasuresResult,
} from "../../../../index";
import { setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("AssetsController:getMeasures", () => {
  const sdk = setupHooks();

  it("should ingest measures from measurements and API source", async () => {
    const assetId = "MagicHouse-debug1";
    const indexId = "engine-ayse";

    const query = sdk.query<
      ApiAssetIngestMeasuresRequest,
      ApiAssetIngestMeasuresResult
    >({
      controller: "device-manager/assets",
      action: "ingestMeasures",
      _id: assetId,
      engineId: indexId,
      body: {
        dataSource: {
          type: "api",
          dataSourceId: "testApi1",
        },
        measurements: [
          {
            measureName: "magiculeExt",
            type: "magicule",
            measuredAt: 170000000,
            values: {
              magicule: 18,
            },
          },
        ],
      },
    });

    await expect(query).resolves.not.toThrow();

    await sdk.collection.refresh(indexId, InternalCollection.MEASURES);

    const total = await sdk.document.count(
      indexId,
      InternalCollection.MEASURES,
    );

    expect(total).toBe(1);

    const document = await sdk.document.search(
      indexId,
      InternalCollection.MEASURES,
      {
        query: {
          equals: {
            "origin._id": "testApi1",
          },
        },
      },
      { lang: "koncorde" },
    );

    expect(document.fetched).toBe(1);

    expect(document.hits[0]._source).toMatchObject({
      asset: {
        _id: "MagicHouse-debug1",
        measureName: "magiculeExt",
      },
      values: {
        magicule: 18,
      },
    });
  });

  it("should not ingest measures with incorrect values", async () => {
    const indexId = "engine-ayse";

    const query = sdk.query<
      ApiAssetIngestMeasuresRequest,
      ApiAssetIngestMeasuresResult
    >({
      controller: "device-manager/assets",
      action: "ingestMeasures",
      _id: "MagicHouse-debug1",
      engineId: "engine-ayse",
      body: {
        dataSource: {
          type: "api",
          dataSourceId: "testApi2",
        },
        measurements: [
          {
            measureName: "magiculeExt",
            type: "magicule",
            measuredAt: 170000000,
            values: {
              magicule: "99",
            },
          },
        ],
      },
    });

    await expect(query).rejects.toThrow(
      "Provided measures does not respect theirs respective schemas",
    );

    const total = await sdk.document.count(
      indexId,
      InternalCollection.MEASURES,
      {
        query: {
          equals: {
            "origin._id": "testApi2",
          },
        },
      },
      { lang: "koncorde" },
    );

    expect(total).toBe(0);
  });

  it("should not ingest measures with unknow asset id", async () => {
    const indexId = "engine-ayse";

    const query = sdk.query<
      ApiAssetIngestMeasuresRequest,
      ApiAssetIngestMeasuresResult
    >({
      controller: "device-manager/assets",
      action: "ingestMeasures",
      _id: "MagicHouse-debug",
      engineId: "engine-ayse",
      body: {
        dataSource: {
          type: "api",
          dataSourceId: "testApi3",
        },
        measurements: [
          {
            measureName: "magiculeExt",
            type: "magicule",
            measuredAt: 170000000,
            values: {
              magicule: 59,
            },
          },
        ],
      },
    });

    await expect(query).rejects.toThrow(
      '"MagicHouse-debug" is not a valid target asset ID',
    );

    const total = await sdk.document.count(
      indexId,
      InternalCollection.MEASURES,
      {
        query: {
          equals: {
            "origin._id": "testApi3",
          },
        },
      },
      { lang: "koncorde" },
    );

    expect(total).toBe(0);
  });
});
