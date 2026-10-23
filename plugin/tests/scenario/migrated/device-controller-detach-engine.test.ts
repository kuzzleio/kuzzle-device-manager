import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk } from "../../helpers";

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
      index: "engine-kuzzle",
    });

    response = await sdk.query({
      controller: "device-manager/devices",
      action: "detachEngine",
      index: "engine-kuzzle",
      _id: "DummyTemp-detached1",
    });

    await expect(
      sdk.document.get("device-manager", "devices", "DummyTemp-detached1"),
    ).resolves.toMatchObject({
      _source: { index: null, _kuzzle_info: { updater: "-1" } },
    });

    await expect(
      sdk.document.exists("engine-kuzzle", "devices", "DummyTemp-detached1"),
    ).resolves.toBe(false);
  });

  it("Refuse to detach a device of an engine the user has no rights on", async () => {
    await sdk.query({
      controller: "device-manager/devices",
      action: "attachEngine",
      _id: "DummyTemp-detached1",
      index: "engine-kuzzle",
    });

    // ? ayse-admin manages the devices of engine-ayse only
    await sdk.auth.login("local", {
      username: "ayse-admin",
      password: "password",
    });

    try {
      for (const index of ["engine-ayse", undefined]) {
        await expect(
          sdk.query({
            controller: "device-manager/devices",
            action: "detachEngine",
            index,
            _id: "DummyTemp-detached1",
          }),
        ).rejects.toMatchObject({
          status: 403,
          message:
            "Forbidden action [engine-kuzzle/device-manager/devices/detachEngine] for user ayse-admin",
        });
      }

      await expect(
        sdk.query({
          controller: "device-manager/devices",
          action: "detachEngine",
          index: "engine-ayse",
          _id: "DummyTemp-unlinked1",
        }),
      ).resolves.toBeDefined();
    } finally {
      sdk.jwt = null;
    }

    await expect(
      sdk.document.get("device-manager", "devices", "DummyTemp-detached1"),
    ).resolves.toMatchObject({ _source: { index: "engine-kuzzle" } });
  });

  it("Error if device is not attached", async () => {
    let response;
    let promise;

    promise = sdk.query({
      controller: "device-manager/devices",
      action: "detachEngine",
      index: "engine-ayse",
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
      index: "engine-ayse",
      _id: "DummyTemp-linked1",
    });

    await expect(
      sdk.document.get("engine-ayse", "assets", "Container-linked1"),
    ).resolves.toMatchObject({
      _source: { linkedMeasures: [] },
    });
  });
});
