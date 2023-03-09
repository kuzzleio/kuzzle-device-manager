import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";

jest.setTimeout(10000);

describe("features/Measure/Provisionning", () => {
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

  it("Create device with auto-provisionning", async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: "document",
      action: "update",
      index: "device-manager",
      collection: "config",
      _id: "plugin--device-manager",
      body: { "device-manager": { provisioningStrategy: "auto" } },
    });

    response = await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "huwels", temperature: 42.2 },
    ]);

    await expect(
      sdk.document.exists("device-manager", "devices", "DummyTemp-huwels")
    ).resolves.toBe(true);
  });
});
