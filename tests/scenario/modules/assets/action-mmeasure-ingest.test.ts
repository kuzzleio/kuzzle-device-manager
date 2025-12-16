import { InternalCollection } from "../../../../lib/modules/plugin";
import {
  ApiAssetmMeasureIngestRequest,
  ApiAssetmMeasureIngestResult,
} from "../../../../index";
import { setupHooks } from "../../../helpers";
import axios from "axios";

jest.setTimeout(10000);

describe("AssetsController:mMeasureIngest", () => {
  describe("AssetsController:mMeasureIngest:sdk", () => {
    const sdk = setupHooks();

    it("should ingest measures from measurements and API source", async () => {
      const assetId = "MagicHouse-debug1";
      const indexId = "engine-ayse";

      const query = sdk.query<
        ApiAssetmMeasureIngestRequest,
        ApiAssetmMeasureIngestResult
      >({
        controller: "device-manager/assets",
        action: "mIngestMeasure",
        assetId,
        engineId: indexId,
        body: {
          dataSource: {
            id: "testApi1",
          },
          measurements: [
            {
              slotName: "magiculeExt",
              measuredAt: 170000000,
              values: {
                magicule: 18,
              },
            },
            {
              slotName: "magiculeInt",
              measuredAt: 170000001, // ? Set this to ensure sorting order
              values: {
                magicule: 25,
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

      expect(total).toBe(2);

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

      expect(document.fetched).toBe(2);

      expect(document.hits[0]._source).toMatchObject({
        asset: {
          _id: "MagicHouse-debug1",
          measureName: "magiculeExt",
        },
        values: {
          magicule: 18,
        },
      });

      expect(document.hits[1]._source).toMatchObject({
        asset: {
          _id: "MagicHouse-debug1",
          measureName: "magiculeInt",
        },
        values: {
          magicule: 25,
        },
      });
    });

    it("should not ingest measures with incorrect values", async () => {
      const assetId = "MagicHouse-debug1";
      const indexId = "engine-ayse";

      const query = sdk.query<
        ApiAssetmMeasureIngestRequest,
        ApiAssetmMeasureIngestResult
      >({
        controller: "device-manager/assets",
        action: "mIngestMeasure",
        assetId,
        engineId: "engine-ayse",
        body: {
          dataSource: {
            id: "testApi2",
          },
          measurements: [
            {
              slotName: "magiculeExt",
              measuredAt: 170000000,
              values: {
                magicule: "99",
              },
            },
          ],
        },
      });

      await expect(query).rejects.toThrow(
        "The provided measures do not comply with their respective schemas",
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
      const assetId = "MagicHouse-debug";
      const indexId = "engine-ayse";

      const query = sdk.query<
        ApiAssetmMeasureIngestRequest,
        ApiAssetmMeasureIngestResult
      >({
        controller: "device-manager/assets",
        action: "mIngestMeasure",
        assetId,
        engineId: "engine-ayse",
        body: {
          dataSource: {
            id: "testApi3",
          },
          measurements: [
            {
              slotName: "magiculeExt",
              measuredAt: 170000000,
              values: {
                magicule: 59,
              },
            },
          ],
        },
      });

      await expect(query).rejects.toThrow(
        'Asset "MagicHouse-debug" does not exists on index "engine-ayse"',
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

  describe("AssetsController:mMeasureIngest:rest", () => {
    const sdk = setupHooks();

    it("should ingest measures from measurements and API source", async () => {
      const assetId = "MagicHouse-debug1";
      const indexId = "engine-ayse";

      const query = await axios.post(
        `http://localhost:7512/_/device-manager/${indexId}/assets/${assetId}/_mMeasureIngest`,
        {
          dataSource: {
            type: "api",
            id: "testApi1",
          },
          measurements: [
            {
              slotName: "magiculeExt",
              measuredAt: 170000000,
              values: {
                magicule: 18,
              },
            },
            {
              slotName: "magiculeInt",
              measuredAt: 170000001, // ? Set this to ensure sorting order
              values: {
                magicule: 25,
              },
            },
          ],
        },
      );

      expect(query.status).toBe(200);

      await sdk.collection.refresh(indexId, InternalCollection.MEASURES);

      const total = await sdk.document.count(
        indexId,
        InternalCollection.MEASURES,
      );

      expect(total).toBe(2);

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

      expect(document.fetched).toBe(2);

      expect(document.hits[0]._source).toMatchObject({
        asset: {
          _id: "MagicHouse-debug1",
          measureName: "magiculeExt",
        },
        values: {
          magicule: 18,
        },
      });

      expect(document.hits[1]._source).toMatchObject({
        asset: {
          _id: "MagicHouse-debug1",
          measureName: "magiculeInt",
        },
        values: {
          magicule: 25,
        },
      });
    });

    it("should not ingest measures with incorrect values", async () => {
      const assetId = "MagicHouse-debug1";
      const indexId = "engine-ayse";

      const query = await axios
        .post(
          `http://localhost:7512/_/device-manager/${indexId}/assets/${assetId}/_mMeasureIngest`,
          {
            dataSource: {
              type: "api",
              id: "testApi2",
            },
            measurements: [
              {
                slotName: "magiculeExt",
                measuredAt: 170000000,
                values: {
                  magicule: "99",
                },
              },
            ],
          },
        )
        .catch((e) => e.response);

      expect(query.status).toBe(400);
      expect(query.data.error.message).toMatch(
        "The provided measures do not comply with their respective schemas",
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
      const assetId = "MagicHouse-debug";
      const indexId = "engine-ayse";

      const query = await axios
        .post(
          `http://localhost:7512/_/device-manager/${indexId}/assets/${assetId}/_mMeasureIngest`,
          {
            dataSource: {
              type: "api",
              id: "testApi3",
            },
            measurements: [
              {
                slotName: "magiculeExt",
                measuredAt: 170000000,
                values: {
                  magicule: 59,
                },
              },
            ],
          },
        )
        .catch((e) => e.response);

      expect(query.status).toBe(400);
      expect(query.data.error.message).toMatch(
        'Asset "MagicHouse-debug" does not exists on index "engine-ayse"',
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
});
