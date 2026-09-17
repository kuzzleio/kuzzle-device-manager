import { beforeAllCreateEngines } from "../../../hooks/engines";
import { beforeEachLoadFixtures } from "../../../hooks/fixtures";

import { useSdk } from "../../../helpers";

describe("Engine deletion", () => {
  const sdk = useSdk();

  beforeAll(async () => {
    await sdk.connect();
    await beforeAllCreateEngines(sdk);
  });

  beforeEach(async () => {
    await beforeAllCreateEngines(sdk);
    await beforeEachLoadFixtures(sdk);
  });

  afterAll(async () => {
    sdk.disconnect();
  });
  const platformIndex = "device-manager";
  const index = "engine-ayse";

  it("Deletes the engine from platform index", async () => {
    const engine = await sdk.document.get(
      platformIndex,
      "config",
      `engine-device-manager--${index}`,
    );

    expect(engine).toBeTruthy();

    await sdk.query({
      controller: "device-manager/engine",
      action: "delete",
      index: index,
    });

    const promise = sdk.document.get(
      platformIndex,
      "config",
      `engine-device-manager--${index}`,
    );

    await expect(promise).rejects.toThrow();
  });
  it("Detach devices from engine in the platform index on engine deletion", async () => {
    const devices = await sdk.document.search(platformIndex, "devices", {
      _source: false,
      query: { bool: { must: { term: { index } } } },
    });
    expect(devices.total).toBeGreaterThan(0);
    await sdk.query({
      controller: "device-manager/engine",
      action: "delete",
      index: index,
    });
    await sdk.collection.refresh(platformIndex, "devices");

    const result = await sdk.document.search(platformIndex, "devices", {
      _source: false,
      query: { bool: { must: { term: { index } } } },
    });
    expect(result.total).toBe(0);
  });
});
