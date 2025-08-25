import { ApiAssetUnlinkDevicesRequest } from "lib/modules/asset";
import { useSdk } from "../../../helpers";
import {
  beforeAllCreateEngines,
  beforeEachLoadFixtures,
  beforeEachTruncateCollections,
} from "../../../hooks";

jest.setTimeout(10000);

describe("features/Device/Controller/UnlinkAssets", () => {
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

  it("Unlink a device from the asset", async () => {
    await sdk.query<ApiAssetUnlinkDevicesRequest>({
      controller: "device-manager/assets",
      action: "unlinkDevices",
      engineId: "engine-ayse",
      _id: "Container-linked1",
      body: {
        linkedMeasures: [
          {
            deviceId: "DummyTemp-linked1",
            allMeasures: true,
          },
        ],
      },
    });

    await expect(
      sdk.document.get("engine-ayse", "devices", "DummyTemp-linked1"),
    ).resolves.toMatchObject({
      _source: { linkedMeasures: [] },
    });

    await expect(
      sdk.document.get("engine-ayse", "assets", "Container-linked1"),
    ).resolves.toMatchObject({
      _source: { linkedMeasures: [] },
    });
  });

  it("Error when the asset was not linked", async () => {
    const promise = sdk.query<ApiAssetUnlinkDevicesRequest>({
      controller: "device-manager/assets",
      action: "unlinkDevices",
      _id: "Container-unlinked1",
      body: {
        linkedMeasures: [
          {
            deviceId: "DummyTemp-unlinked1",
            allMeasures: true,
          },
        ],
      },
      engineId: "engine-ayse",
    });

    await expect(promise).rejects.toMatchObject({
      message: 'Device "DummyTemp-unlinked1" is not linked to an asset.',
    });
  });

  it("Unlink asset when deleting device", async () => {
    let response;

    response = await sdk.query({
      controller: "device-manager/devices",
      action: "delete",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
    });

    await expect(
      sdk.document.get("engine-ayse", "assets", "Container-linked1"),
    ).resolves.toMatchObject({
      _source: { linkedMeasures: { length: 0 } },
    });

    await sdk.collection.refresh("engine-ayse", "assets-history");

    response = await sdk.query({
      controller: "document",
      action: "search",
      index: "engine-ayse",
      collection: "assets-history",
      body: { sort: { "_kuzzle_info.createdAt": "desc" } },
    });

    expect(response.result).toMatchObject({
      hits: {
        "0": {
          _source: {
            id: "Container-linked1",
            event: {
              name: "unlink",
              unlink: { deviceId: "DummyTemp-linked1" },
            },
            asset: { linkedMeasures: [] },
          },
        },
        length: 1,
      },
    });
  });
});
