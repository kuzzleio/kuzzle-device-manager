import {
  ApiDeviceReceiveMeasureRequest,
  ApiDeviceReceiveMeasureResult,
} from "../../../index";

import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { getSdk } from "../../hooks/getSdk";

jest.setTimeout(10000);

describe("DeviceController: receiveMeasure", () => {
  const sdk = getSdk();

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

  it("should receive a formated measure and process it in the ingestion pipeline", async () => {
    await sdk.query<
      ApiDeviceReceiveMeasureRequest,
      ApiDeviceReceiveMeasureResult
    >({
      controller: "device-manager/devices",
      action: "receiveMeasure",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
      body: {
        payloadUuids: ["foobar-barfoo"],
        measure: {
          measuredAt: 1674906229441,
          measureName: "temperature",
          type: "temperature",
          values: {
            temperature: 25.5,
          },
        },
      },
    });

    await Promise.all([
      sdk.collection.refresh("engine-ayse", "measures"),
      sdk.collection.refresh("device-manager", "payloads"),
    ]);

    const measures = await sdk.document.search(
      "engine-ayse",
      "measures",
      {
        query: {
          equals: { measuredAt: 1674906229441 },
        },
      },
      { lang: "koncorde", limit: 1 }
    );

    expect(measures.hits).toHaveLength(1);

    expect(measures.hits[0]._source).toMatchObject({
      origin: {
        _id: "DummyTemp-linked1",
        payloadUuids: ["foobar-barfoo"],
      },
      asset: {
        _id: "Container-linked1",
      },
      measuredAt: 1674906229441,
      type: "temperature",
      values: {
        temperature: 25.5,
      },
    });

    const payloads = await sdk.document.search(
      "device-manager",
      "payloads",
      {
        query: {
          equals: { uuid: "foobar-barfoo" },
        },
      },
      { lang: "koncorde", limit: 1 }
    );

    expect(payloads.hits).toHaveLength(1);
    expect(payloads.hits[0]._source).toMatchObject({
      deviceModel: "DummyTemp",
      apiOrigin: "device-manager/devices:receiveMeasure",
      payload: {
        measuredAt: 1674906229441,
        measureName: "temperature",
        type: "temperature",
        values: {
          temperature: 25.5,
        },
      },
    });

    const device = await sdk.document.get(
      "engine-ayse",
      "devices",
      "DummyTemp-linked1"
    );

    expect(device._source).toMatchObject({
      measures: {
        temperature: {
          values: {
            temperature: 25.5,
          },
        },
      },
    });
  });
});
