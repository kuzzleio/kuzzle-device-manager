import { ContainerAssetContent } from "../../../application/assets/Container";

import { sendDummyTempPayloads, setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("Ingestion Pipeline: before ingestion", () => {
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

    const asset = await sdk.document.get<ContainerAssetContent>(
      "engine-ayse",
      "assets",
      "Container-linked1"
    );
    expect(asset._source.measures).toMatchObject({
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
