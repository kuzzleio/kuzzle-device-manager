import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";

jest.setTimeout(10000);

describe("features/Decoder/PayloadsMappings", () => {
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

  it("Register custom mappings for payloads collection", async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: "collection",
      action: "getMapping",
      index: "device-manager",
      collection: "payloads",
    });

    expect(response.result).toMatchObject({
      properties: {
        payload: { properties: { deviceEUI: { type: "keyword" } } },
      },
    });
  });
});
