import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";

jest.setTimeout(10000);

describe("features/Device/Metadata", () => {
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

  it("Register custom metadata for devices", async () => {
    let response;
    let promise;

    await expect(
      sdk.collection.getMapping("device-manager", "devices")
    ).resolves.toMatchObject({
      properties: {},
    });
  });
});
