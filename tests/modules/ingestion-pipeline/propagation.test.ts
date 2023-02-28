import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { sendDummyTempPayloads, useSdk } from "../../helpers";
import { MeasureContent } from "../../../lib/modules/measure";

jest.setTimeout(10000);

describe("Ingestion Pipeline: propagation", () => {
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

  it("should add asset info to measure only to linked measures", async () => {
    await sendDummyTempPayloads(sdk, [
      {
        deviceEUI: "linked1",
        temperature: 21,
        battery: 98,
      },
    ]);
    await sdk.collection.refresh("engine-ayse", "measures");

    const result = await sdk.document.search<MeasureContent>(
      "engine-ayse",
      "measures"
    );

    const batteryMeasure = result.hits.find(
      (m) => m._source.type === "battery"
    );
    const temperatureMeasures = result.hits.filter(
      (m) => m._source.type === "temperature"
    );

    expect(batteryMeasure?._source.asset).toBe(null);

    for (const temperatureMeasure of temperatureMeasures) {
      expect(temperatureMeasure._source.asset?._id).toBe("Container-linked1");
    }
  });
});
