import {
  ApiDeviceCreateRequest,
  ApiDeviceCreateResult,
  ApiDeviceUpdateRequest,
  ApiDeviceUpdateResult,
  ApiDeviceGetRequest,
  ApiDeviceGetResult,
  ApiDeviceSearchRequest,
  ApiDeviceSearchResult,
  ApiDeviceDeleteRequest,
  ApiDeviceDeleteResult,
} from "../../../../index";

import { setupHooks } from "../../../helpers";

describe("Device SCRUD", () => {
  const sdk = setupHooks();

  it("should create a device, update metadata then get and search it", async () => {
    const now = Date.now();
    await sdk.query<ApiDeviceCreateRequest, ApiDeviceCreateResult>({
      controller: "device-manager/devices",
      action: "create",
      index: "engine-ayse",
      body: { model: "DummyTemp", reference: "scrudme" },
    });

    await sdk.query<ApiDeviceUpdateRequest, ApiDeviceUpdateResult>({
      controller: "device-manager/devices",
      action: "update",
      index: "engine-ayse",
      _id: "DummyTemp-scrudme",
      body: { metadata: { color: "RED" } },
    });

    const { result: device } = await sdk.query<
      ApiDeviceGetRequest,
      ApiDeviceGetResult
    >({
      controller: "device-manager/devices",
      action: "get",
      index: "engine-ayse",
      _id: "DummyTemp-scrudme",
    });

    expect(device._source).toMatchObject({
      model: "DummyTemp",
      reference: "scrudme",
      metadata: { color: "RED" },
      measureSlots: [
        { name: "temperature", type: "temperature" },
        { name: "accelerationSensor", type: "acceleration" },
        { name: "battery", type: "battery" },
      ],
      _kuzzle_info: { author: "-1", updater: "-1" },
    });
    const provisioningDevice = await sdk.document.get(
      "device-manager",
      "devices",
      "DummyTemp-scrudme",
    );
    expect(provisioningDevice._source.provisionedAt).toBeGreaterThanOrEqual(
      now,
    );
    await sdk.collection.refresh("engine-ayse", "devices");

    const { result } = await sdk.query<
      ApiDeviceSearchRequest,
      ApiDeviceSearchResult
    >({
      controller: "device-manager/devices",
      action: "search",
      index: "engine-ayse",
      lang: "koncorde",
      body: { query: { equals: { reference: "scrudme" } } },
    });

    expect(result.total).toBe(1);
    expect(result.hits[0]._source).toMatchObject({
      reference: "scrudme",
      metadata: { color: "RED" },
    });

    await sdk.query<ApiDeviceDeleteRequest, ApiDeviceDeleteResult>({
      controller: "device-manager/devices",
      action: "delete",
      index: "engine-ayse",
      _id: "DummyTemp-scrudme",
    });

    const exists = await sdk.document.exists(
      "engine-ayse",
      "devices",
      "DummyTemp-scrudme",
    );

    expect(exists).toBe(false);
  });

  it("should not leave a provisioned device when the tenant refuses it", async () => {
    await expect(
      sdk.query<ApiDeviceCreateRequest, ApiDeviceCreateResult>({
        controller: "device-manager/devices",
        action: "create",
        index: "engine-ayse",
        body: {
          model: "DummyTemp",
          reference: "ghost",
          metadata: { color: { a: 1 } },
        },
      }),
    ).rejects.toThrow();

    await expect(
      sdk.document.exists("device-manager", "devices", "DummyTemp-ghost"),
    ).resolves.toBe(false);

    await expect(
      sdk.query<ApiDeviceCreateRequest, ApiDeviceCreateResult>({
        controller: "device-manager/devices",
        action: "create",
        index: "engine-ayse",
        body: { model: "DummyTemp", reference: "ghost" },
      }),
    ).resolves.toBeDefined();
  });

  it("should reject invalid references and name the duplicated device", async () => {
    const create = (reference: string) =>
      sdk.query<ApiDeviceCreateRequest, ApiDeviceCreateResult>({
        controller: "device-manager/devices",
        action: "create",
        index: "engine-ayse",
        body: { model: "DummyTemp", reference },
      });

    await expect(create("")).rejects.toThrow(
      "The device reference must not be empty.",
    );
    await expect(create(" ")).rejects.toThrow(
      "The device reference must not be empty.",
    );
    for (const reference of ["a b", "a/b", "a?b", "a#b", "a%b", "a "]) {
      await expect(create(reference)).rejects.toThrow(
        `The device reference "${reference}" must not contain whitespaces or any of the characters / ? # % \\`,
      );
    }
    await expect(create("a".repeat(257))).rejects.toThrow(
      /^The device reference "a{32}\.\.\." exceeds 256 bytes\.$/,
    );

    await create("duplicated");
    await expect(create("duplicated")).rejects.toThrow(
      'Device "DummyTemp-duplicated" already exists.',
    );
  });

  it("should delete a device from the platform index, with its tenant copy", async () => {
    await expect(
      sdk.query<ApiDeviceDeleteRequest, ApiDeviceDeleteResult>({
        controller: "device-manager/devices",
        action: "delete",
        index: "device-manager",
        _id: "DummyTemp-detached1",
      }),
    ).resolves.toBeDefined();
    await expect(
      sdk.document.exists("device-manager", "devices", "DummyTemp-detached1"),
    ).resolves.toBe(false);

    await sdk.query<ApiDeviceDeleteRequest, ApiDeviceDeleteResult>({
      controller: "device-manager/devices",
      action: "delete",
      index: "device-manager",
      _id: "DummyTemp-unlinked1",
    });
    await expect(
      sdk.document.exists("device-manager", "devices", "DummyTemp-unlinked1"),
    ).resolves.toBe(false);
    await expect(
      sdk.document.exists("engine-ayse", "devices", "DummyTemp-unlinked1"),
    ).resolves.toBe(false);
  });

  it("should return an error when creating device of unknown model", async () => {
    await expect(
      sdk.query<ApiDeviceCreateRequest, ApiDeviceCreateResult>({
        controller: "device-manager/devices",
        action: "create",
        index: "engine-ayse",
        body: { model: "NotExisting", reference: "scrudme" },
      }),
    ).rejects.toThrow('Unknown Device model "NotExisting".');
  });
});
