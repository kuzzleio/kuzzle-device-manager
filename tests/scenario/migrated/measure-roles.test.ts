import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";

jest.setTimeout(10000);

describe("features/Measure/Roles", () => {
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

  it("Find default measures roles", async () => {
    let response;
    let promise;

    await expect(
      sdk.security.getRole("measures.reader")
    ).resolves.toMatchObject({
      controllers: {
        "device-manager/models": { actions: { listMeasures: true } },
      },
    });

    await expect(sdk.security.getRole("measures.admin")).resolves.toMatchObject(
      {
        controllers: {
          "device-manager/models": {
            actions: {
              listMeasures: true,
              writeMeasure: true,
              deleteMeasure: true,
            },
          },
        },
      }
    );
  });
});
