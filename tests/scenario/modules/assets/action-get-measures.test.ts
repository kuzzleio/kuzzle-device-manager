import { JSONObject } from "kuzzle";

import {
  ApiAssetGetMeasuresRequest,
  ApiAssetGetMeasuresResult,
} from "../../../../index";
import { sendDummyTempPayloads, setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("AssetsController:getMeasures", () => {
  const sdk = setupHooks();

  beforeEach(async () => {
    await sendDummyTempPayloads(sdk, [
      { deviceEUI: "unlinked1", temperature: 12 },
      { deviceEUI: "unlinked1", temperature: 14 },
      { deviceEUI: "linked1", temperature: 20 },
      { deviceEUI: "linked1", temperature: 22 },
      { deviceEUI: "linked1", temperature: 24 },
      { deviceEUI: "linked2", temperature: 42 },
      { deviceEUI: "linked2", temperature: 44 },
    ]);
    await sdk.collection.refresh("engine-ayse", "measures");
  });

  it("should support elasticsearch and koncorde query", async () => {
    async function testQuery(
      query: JSONObject,
      lang: ApiAssetGetMeasuresRequest["lang"]
    ) {
      try {
        return await sdk.query<ApiAssetGetMeasuresRequest>({
          controller: "device-manager/assets",
          action: "getMeasures",
          engineId: "engine-ayse",
          _id: "Container-linked1",
          size: 1,
          body: { query },
          lang,
        });
      } catch (error) {
        return error;
      }
    }

    const esError = await testQuery(
      { equals: { "values.temperature": 40 } },
      "elasticsearch"
    );
    expect(esError.status).toBe(400);

    const esResponse = await testQuery(
      { term: { "values.temperature": 40 } },
      "elasticsearch"
    );
    expect(esResponse.status).toBe(200);

    const koncordeResponse = await testQuery(
      { equals: { "values.temperature": 40 } },
      "koncorde"
    );
    expect(koncordeResponse.status).toBe(200);
  });

  it("should get asset measures history", async () => {
    const { result } = await sdk.query<
      ApiAssetGetMeasuresRequest,
      ApiAssetGetMeasuresResult
    >({
      controller: "device-manager/assets",
      action: "getMeasures",
      engineId: "engine-ayse",
      _id: "Container-linked1",
    });

    expect(result.total).toBe(3);
    for (const measure of result.measures) {
      expect(measure._source.asset?._id).toBe("Container-linked1");
      expect(measure._source.type).toBe("temperature");
    }
  });

  it("should sort measures history", async () => {
    const { result } = await sdk.query<
      ApiAssetGetMeasuresRequest,
      ApiAssetGetMeasuresResult
    >({
      controller: "device-manager/assets",
      action: "getMeasures",
      engineId: "engine-ayse",
      _id: "Container-linked1",
      body: {
        sort: { "values.temperature": "desc" },
      },
    });

    expect(result.total).toBe(3);
    expect(result.measures[0]._source.values.temperature).toBe(24);
    expect(result.measures[1]._source.values.temperature).toBe(22);
    expect(result.measures[2]._source.values.temperature).toBe(20);
  });

  it("should filter measures by query", async () => {
    const { result } = await sdk.query<
      ApiAssetGetMeasuresRequest,
      ApiAssetGetMeasuresResult
    >({
      controller: "device-manager/assets",
      action: "getMeasures",
      engineId: "engine-ayse",
      _id: "Container-linked1",
      body: {
        query: { equals: { "values.temperature": 22 } },
      },
      lang: "koncorde",
    });

    expect(result.total).toBe(1);
    expect(result.measures[0]._source.values.temperature).toBe(22);
  });

  it("should filter measures by type", async () => {
    const { result } = await sdk.query<
      ApiAssetGetMeasuresRequest,
      ApiAssetGetMeasuresResult
    >({
      controller: "device-manager/assets",
      action: "getMeasures",
      engineId: "engine-ayse",
      _id: "Container-linked1",
      type: "position",
    });

    expect(result.total).toBe(0);
    expect(result).toMatchObject({ measures: [] });
  });
});
