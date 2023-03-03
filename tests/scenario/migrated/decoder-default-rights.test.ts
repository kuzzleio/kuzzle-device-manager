import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";

jest.setTimeout(10000);

describe("features/Decoder/DefaultRights", () => {
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

  it("Creates default roles, profiles and users", async () => {
    let response;
    let promise;

    await expect(
      sdk.security.getRole("payload_gateway")
    ).resolves.toMatchObject({});

    await expect(
      sdk.security.getProfile("payload_gateway")
    ).resolves.toMatchObject({});

    await expect(
      sdk.security.getUser("payload_gateway")
    ).resolves.toMatchObject({});
  });
});
