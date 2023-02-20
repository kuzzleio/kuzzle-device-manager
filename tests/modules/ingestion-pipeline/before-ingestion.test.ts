import { ContainerAssetContent } from "../../../features/fixtures/application/assets/Container";

import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { sendDummyTemp, useSdk } from "../../helpers";

jest.setTimeout(10000);

describe("Ingestion Pipeline: before ingestion", () => {
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

  it("allows to add a new measure only to the asset", async () => {
    await sendDummyTemp(sdk, {
      deviceEUI: "linked1",
      temperature: 21,
      metadata: {
        // search this string to find the associated pipe
        color: "test-create-new-asset-measure",
      },
    });

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
