import { JSONObject } from "kuzzle";

import { setupHooks, sendPayloads } from "../../../helpers";
import {
  ApiDeviceGetMeasuresRequest,
  ApiDeviceGetMeasuresResult,
} from "lib/modules/device";

jest.setTimeout(10000);

describe("DevicesController:GetMeasures", () => {
  const sdk = setupHooks();

  beforeEach(async () => {
    await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "linked1", temperature: 42 },
      { deviceEUI: "linked1", temperature: 41 },
      { deviceEUI: "linked1", temperature: 40 },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");
  });

  it("should support elasticsearch and koncorde query", async () => {
    async function testQuery(
      query: JSONObject,
      lang: ApiDeviceGetMeasuresRequest["lang"],
    ) {
      try {
        return await sdk.query<ApiDeviceGetMeasuresRequest>({
          controller: "device-manager/devices",
          action: "getMeasures",
          engineId: "engine-ayse",
          _id: "DummyTemp-linked1",
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
      "elasticsearch",
    );
    expect(esError.status).toBe(400);

    const esResponse = await testQuery(
      { term: { "values.temperature": 40 } },
      "elasticsearch",
    );
    expect(esResponse.status).toBe(200);

    const koncordeResponse = await testQuery(
      { equals: { "values.temperature": 40 } },
      "koncorde",
    );
    expect(koncordeResponse.status).toBe(200);
  });

  it("should get device measures history", async () => {
    const { result } = await sdk.query<
      ApiDeviceGetMeasuresRequest,
      ApiDeviceGetMeasuresResult
    >({
      controller: "device-manager/devices",
      action: "getMeasures",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
    });

    expect(result.total).toBe(6);
    for (const measure of result.measures) {
      expect(measure._source.origin._id).toBe("DummyTemp-linked1");
    }
  });

  it("should sort measures history", async () => {
    const { result } = await sdk.query<ApiDeviceGetMeasuresRequest>({
      controller: "device-manager/devices",
      action: "getMeasures",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
      size: 2,
      body: { sort: { "values.temperature": "desc" } },
    });

    expect(result).toMatchObject({
      total: 6,
      measures: { length: 2 },
    });

    expect(result.measures[0]).toMatchObject({
      _source: {
        values: { temperature: 42 },
        origin: { _id: "DummyTemp-linked1" },
      },
    });

    expect(result.measures[1]).toMatchObject({
      _source: {
        values: { temperature: 41 },
        origin: { _id: "DummyTemp-linked1" },
      },
    });
  });

  it("should filter measures by query", async () => {
    const { result } = await sdk.query<ApiDeviceGetMeasuresRequest>({
      controller: "device-manager/devices",
      action: "getMeasures",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
      body: { query: { equals: { "values.temperature": 40 } } },
      lang: "koncorde",
    });

    expect(result.measures[0]).toMatchObject({
      _source: {
        values: { temperature: 40 },
        origin: { _id: "DummyTemp-linked1" },
      },
    });
  });

  it("should filter measures by type", async () => {
    const { result } = await sdk.query<ApiDeviceGetMeasuresRequest>({
      controller: "device-manager/devices",
      action: "getMeasures",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
      type: "position",
    });

    expect(result).toMatchObject({ measures: [] });
  });
});
