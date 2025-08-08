import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk } from "../../helpers";

jest.setTimeout(10000);

describe("features/Device/Controller/DetachEngine", () => {
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

  it("Detach device from an engine", async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: "device-manager/devices",
      action: "attachEngine",
      _id: "DummyTemp-detached1",
      engineId: "engine-kuzzle",
    });

    response = await sdk.query({
      controller: "device-manager/devices",
      action: "detachEngine",
      engineId: "engine-kuzzle",
      _id: "DummyTemp-detached1",
    });

    await expect(
      sdk.document.get("device-manager", "devices", "DummyTemp-detached1")
    ).resolves.toMatchObject({
      _source: { engineId: null, _kuzzle_info: { updater: "-1" } },
    });

    await expect(
      sdk.document.exists("engine-kuzzle", "devices", "DummyTemp-detached1")
    ).resolves.toBe(false);
  });

  it("Error if device is not attached", async () => {
    let response;
    let promise;

    promise = sdk.query({
      controller: "device-manager/devices",
      action: "detachEngine",
      engineId: "engine-ayse",
      _id: "DummyTemp-detached1",
    });

    await expect(promise).rejects.toMatchObject({
      message: 'Device "DummyTemp-detached1" is not attached to an engine.',
    });
  });

  it("Unlink the linked device", async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: "device-manager/devices",
      action: "detachEngine",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
    });

    await expect(
      sdk.document.get("engine-ayse", "assets", "Container-linked1")
    ).resolves.toMatchObject({
      _source: { linkedMeasures: [] },
    });


  });
});
