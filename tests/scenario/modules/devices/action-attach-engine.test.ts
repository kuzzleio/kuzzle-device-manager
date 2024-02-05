import { ApiDeviceAttachEngineRequest } from "../../../../index";

import { sendDummyTempPayloads, setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("DevicesController:attachEngine", () => {
  const sdk = setupHooks();

  it("should attach the device to an engine and historize measures", async () => {
    await sdk.query<ApiDeviceAttachEngineRequest>({
      controller: "device-manager/devices",
      action: "attachEngine",
      _id: "DummyTemp-detached1",
      engineId: "engine-kuzzle",
    });

    await expect(
      sdk.document.get("device-manager", "devices", "DummyTemp-detached1"),
    ).resolves.toMatchObject({
      _source: {
        engineId: "engine-kuzzle",
        _kuzzle_info: {
          updater: "-1",
        },
      },
    });

    await expect(
      sdk.document.get("engine-kuzzle", "devices", "DummyTemp-detached1"),
    ).resolves.toMatchObject({
      _source: {
        engineId: "engine-kuzzle",
        _kuzzle_info: {
          author: "-1",
        },
      },
    });

    await sendDummyTempPayloads(sdk, [
      {
        deviceEUI: "detached1",
        temperature: 21,
      },
    ]);
    await sdk.collection.refresh("engine-kuzzle", "measures");
    const count = await sdk.document.count("engine-kuzzle", "measures");

    expect(count).toBe(2);
  });

  it("should return appropriate error messages", async () => {
    await expect(
      sdk.query<ApiDeviceAttachEngineRequest>({
        controller: "device-manager/devices",
        action: "attachEngine",
        _id: "not-existing-device",
        engineId: "engine-kuzzle",
      }),
    ).rejects.toMatchObject({
      id: "services.storage.not_found",
    });

    await expect(
      sdk.query<ApiDeviceAttachEngineRequest>({
        controller: "device-manager/devices",
        action: "attachEngine",
        _id: "DummyTemp-detached1",
        engineId: "engine-kaliop",
      }),
    ).rejects.toMatchObject({
      message: 'Engine "engine-kaliop" does not exists.',
    });

    await expect(
      sdk.query<ApiDeviceAttachEngineRequest>({
        controller: "device-manager/devices",
        action: "attachEngine",
        _id: "DummyTemp-linked1",
        engineId: "engine-ayse",
      }),
    ).rejects.toMatchObject({
      message: 'Device "DummyTemp-linked1" is already attached to an engine.',
    });
  });
});
