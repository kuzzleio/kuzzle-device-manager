import { InternalCollection } from "../../../../lib/modules/plugin";
import {
  ApiAssetMeasureIngestRequest,
  ApiAssetMeasureIngestResult,
} from "../../../../index";
import { setupHooks } from "../../../helpers";
import axios from "axios";

jest.setTimeout(10000);

describe("AssetsController:measureIngest", () => {
  describe("AssetsController:measureIngest:sdk", () => {
    const sdk = setupHooks();

    it("should ingest measure", async () => {
      const assetId = "MagicHouse-debug1";
      const indexId = "engine-ayse";

      const query = sdk.query<
        ApiAssetMeasureIngestRequest,
        ApiAssetMeasureIngestResult
      >({
        controller: "device-manager/assets",
        action: "measureIngest",
        _id: assetId,
        engineId: indexId,
        slotName: "magiculeExt",
        body: {
          dataSourceId: "testApi1",
          measuredAt: 170000000,
          values: {
            magicule: 18,
          },
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

    it("should not ingest measure with incorrect values", async () => {
      const indexId = "engine-ayse";

      const query = sdk.query<
        ApiAssetMeasureIngestRequest,
        ApiAssetMeasureIngestResult
      >({
        controller: "device-manager/assets",
        action: "measureIngest",
        _id: "MagicHouse-debug1",
        engineId: "engine-ayse",
        slotName: "magiculeExt",
        body: {
          dataSourceId: "testApi2",
          measuredAt: 170000000,
          values: {
            magicule: "99",
          },
        },
      });

      await expect(query).rejects.toThrow(
        "The provided measure does not respect its schema",
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

    it("should not ingest measure with unknow asset id", async () => {
      const indexId = "engine-ayse";

      const query = sdk.query<
        ApiAssetMeasureIngestRequest,
        ApiAssetMeasureIngestResult
      >({
        controller: "device-manager/assets",
        action: "measureIngest",
        _id: "MagicHouse-debug",
        engineId: "engine-ayse",
        slotName: "magiculeExt",
        body: {
          dataSourceId: "testApi3",
          measuredAt: 170000000,
          values: {
            magicule: 99,
          },
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

  describe("AssetsController:measureIngest:rest", () => {
    const sdk = setupHooks();

    it("should ingest measure", async () => {
      const assetId = "MagicHouse-debug1";
      const indexId = "engine-ayse";

      const query = await axios.post(
        `http://localhost:7512/_/device-manager/${indexId}/assets/${assetId}/measures/magiculeExt`,
        {
          dataSourceId: "testApi1",
          measuredAt: 170000000,
          values: {
            magicule: 18,
          },
        },
      );

      expect(query.status).toBe(200);

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

    it("should not ingest measure with incorrect values", async () => {
      const assetId = "MagicHouse-debug1";
      const indexId = "engine-ayse";

      const query = await axios
        .post(
          `http://localhost:7512/_/device-manager/${indexId}/assets/${assetId}/measures/magiculeExt`,
          {
            dataSourceId: "testApi2",
            measuredAt: 170000000,
            values: {
              magicule: "99",
            },
          },
        )
        .catch((e) => e.response);

      expect(query.status).toBe(400);
      expect(query.data.error.message).toBe(
        "The provided measure does not respect its schema",
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

    it("should not ingest measure with unknow asset id", async () => {
      const assetId = "MagicHouse-debug";
      const indexId = "engine-ayse";

      const query = await axios
        .post(
          `http://localhost:7512/_/device-manager/${indexId}/assets/${assetId}/measures/magiculeExt`,
          {
            dataSourceId: "testApi3",
            measuredAt: 170000000,
            values: {
              magicule: 99,
            },
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
