import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";

jest.setTimeout(10000);

describe("features/Decoder/Roles", () => {
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

  it("Find default decoders roles", async () => {
    let response;
    let promise;

    await expect(sdk.security.getRole("decoders.admin")).resolves.toMatchObject(
      { controllers: { "device-manager/decoders": { actions: { "*": true } } } }
    );
  });

  it("Find default payloads roles", async () => {
    let response;
    let promise;

    await expect(sdk.security.getRole("payloads.all")).resolves.toMatchObject({
      controllers: { "device-manager/payloads": { actions: { "*": true } } },
    });
  });
});
