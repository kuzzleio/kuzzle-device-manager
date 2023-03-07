import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";

jest.setTimeout(10000);

describe("features/Device/Controller/GetMeasures", () => {
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

  it("Get device measures history", async () => {
    let response;
    let promise;

    response = await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "linked1", temperature: 42 },
      { deviceEUI: "linked1", temperature: 41 },
      { deviceEUI: "linked1", temperature: 40 },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    response = await sdk.query({
      controller: "device-manager/devices",
      action: "getMeasures",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
      size: 2,
      body: { sort: { "values.temperature": "desc" } },
    });

    expect(response.result).toMatchObject({
      total: 6,
      measures: { length: 2 },
    });

    expect(response.result.measures[0]).toMatchObject({
      _source: {
        values: { temperature: 42 },
        origin: { _id: "DummyTemp-linked1" },
      },
    });

    expect(response.result.measures[1]).toMatchObject({
      _source: {
        values: { temperature: 41 },
        origin: { _id: "DummyTemp-linked1" },
      },
    });

    response = await sdk.query({
      controller: "device-manager/devices",
      action: "getMeasures",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
      body: { query: { equals: { "values.temperature": 40 } } },
    });

    expect(response.result.measures[0]).toMatchObject({
      _source: {
        values: { temperature: 40 },
        origin: { _id: "DummyTemp-linked1" },
      },
    });

    response = await sdk.query({
      controller: "device-manager/devices",
      action: "getMeasures",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
      type: "position",
    });

    expect(response.result).toMatchObject({ measures: [] });
  });
});
