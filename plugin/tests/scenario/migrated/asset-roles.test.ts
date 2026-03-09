import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";

jest.setTimeout(10000);

describe("features/Asset/Roles", () => {
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

  it("Find default assets roles", async () => {
    let response;
    let promise;

    await expect(sdk.security.getRole("assets.reader")).resolves.toMatchObject({
      controllers: {
        "device-manager/assets": {
          actions: { get: true, search: true, getMeasures: true },
        },
        "device-manager/models": { actions: { listAssets: true } },
      },
    });

    await expect(sdk.security.getRole("assets.admin")).resolves.toMatchObject({
      controllers: {
        "device-manager/assets": { actions: { "*": true } },
        "device-manager/models": {
          actions: { listAssets: true, writeAsset: true, deleteAsset: true },
        },
      },
    });
  });
});
