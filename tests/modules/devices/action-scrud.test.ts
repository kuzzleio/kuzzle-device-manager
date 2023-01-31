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
} from "../../../index";

import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk } from "../../hooks/useSdk";

jest.setTimeout(10000);

describe("Device SCRUD", () => {
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

  it("should create a device, update metadata then get and search it", async () => {
    await sdk.query<ApiDeviceCreateRequest, ApiDeviceCreateResult>({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: {
        model: "DummyTemp",
        reference: "scrudme",
      },
    });

    await sdk.query<ApiDeviceUpdateRequest, ApiDeviceUpdateResult>({
      controller: "device-manager/devices",
      action: "update",
      engineId: "engine-ayse",
      _id: "DummyTemp-scrudme",
      body: {
        metadata: {
          color: "RED",
        },
      },
    });

    const { result: device } = await sdk.query<
      ApiDeviceGetRequest,
      ApiDeviceGetResult
    >({
      controller: "device-manager/devices",
      action: "get",
      engineId: "engine-ayse",
      _id: "DummyTemp-scrudme",
    });

    expect(device._source).toMatchObject({
      model: "DummyTemp",
      reference: "scrudme",
      metadata: {
        color: "RED",
      },
      _kuzzle_info: {
        author: "-1",
        updater: "-1",
      },
    });

    await sdk.collection.refresh("engine-ayse", "devices");

    const { result } = await sdk.query<
      ApiDeviceSearchRequest,
      ApiDeviceSearchResult
    >({
      controller: "device-manager/devices",
      action: "search",
      engineId: "engine-ayse",
      lang: "koncorde",
      body: {
        query: {
          equals: { reference: "scrudme" },
        },
      },
    });

    expect(result.total).toBe(1);
    expect(result.hits[0]._source).toMatchObject({
      reference: "scrudme",
      metadata: {
        color: "RED",
      },
    });

    await sdk.query<ApiDeviceDeleteRequest, ApiDeviceDeleteResult>({
      controller: "device-manager/devices",
      action: "delete",
      engineId: "engine-ayse",
      _id: "DummyTemp-scrudme",
    });

    const exists = await sdk.document.exists(
      "engine-ayse",
      "devices",
      "DummyTemp-scrudme"
    );

    expect(exists).toBe(false);
  });

  it("should return an error when creating device of unknown model", async () => {
    try {
      await sdk.query<ApiDeviceCreateRequest, ApiDeviceCreateResult>({
        controller: "device-manager/devices",
        action: "create",
        engineId: "engine-ayse",
        body: {
          model: "NotExisting",
          reference: "scrudme",
        },
      });
    } catch (error) {
      expect(error.message).toBe('Unknown Device model "NotExisting".');
    }
  });
});
