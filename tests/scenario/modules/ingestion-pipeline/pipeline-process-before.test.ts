import { sendDummyTempPayloads, setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("Ingestion Pipeline: process before", () => {
  const sdk = setupHooks();

  it("allows to add a new measure only to the asset", async () => {
    await sendDummyTempPayloads(sdk, [
      {
        deviceEUI: "linked1",
        temperature: 21,
        metadata: {
          // search this string to find the associated pipe
          color: "test-create-new-asset-measure",
        },
      },
    ]);

    await sdk.collection.refresh("engine-ayse", "measures");

    const lastMeasuresResponse = await sdk.query({
      controller: "device-manager/assets",
      action: "getLastMeasures",
      engineId: "engine-ayse",
      _id: "Container-linked1",
    });

    expect(lastMeasuresResponse.result).toMatchObject({
      temperatureExt: {
        values: {
          temperature: 21,
        },
      },
      temperatureWeather: {
        values: {
          temperature: 21.21,
        },
      },
    });
  });
});
