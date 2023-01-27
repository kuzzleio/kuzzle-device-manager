import should from "should";

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

import { getSdk } from "../../hooks/getSdk";

jest.setTimeout(10000);

describe("Device SCRUD", () => {
  const sdk = getSdk();

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

    should(device._source).match({
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

    should(result.total).eql(1);
    should(result.hits[0]._source).match({
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

    should(exists).eql(false);
  });

  it("should return an error when creating device of unknown model", async () => {
    const promise = sdk.query<ApiDeviceCreateRequest, ApiDeviceCreateResult>({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: {
        model: "NotExisting",
        reference: "scrudme",
      },
    });

    should(promise).rejectedWith('Unknown Device model "NotExisting".');
  });
});
