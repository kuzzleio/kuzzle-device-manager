import { ResponsePayload } from "kuzzle-sdk";
import { PartialDeep } from "type-fest";
import {
  ApiAssetCreateRequest,
  ApiAssetGetRequest,
  ApiAssetGetResult,
} from "../../../../lib/modules/asset";
import {
  ApiModelDeleteAssetRequest,
  ApiModelWriteAssetRequest,
} from "../../../../lib/modules/model";
import { setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("Asset model metadata propagation", () => {
  const sdk = setupHooks();

  beforeAll(async () => {
    if (
      await sdk.document.exists(
        "device-manager",
        "models",
        "model-asset-Pallet",
      )
    ) {
      await sdk.query<ApiModelDeleteAssetRequest>({
        controller: "device-manager/models",
        action: "deleteAsset",
        _id: "model-asset-Pallet",
      });
    }
  });

  afterEach(async () => {
    await sdk.query<ApiModelDeleteAssetRequest>({
      controller: "device-manager/models",
      action: "deleteAsset",
      _id: "model-asset-Pallet",
    });
  });

  it("should add new metadata with default value set on linked assets in all engines", async () => {
    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Pallet",
        metadataMappings: {
          depth: { type: "integer" },
          width: { type: "integer" },
        },
        defaultValues: {
          depth: 80,
          width: 120,
        },
      },
    });

    await sdk.query<ApiAssetCreateRequest>({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-ayse",
      body: {
        model: "Pallet",
        reference: "unlinked1",
        metadata: {
          depth: 82,
          width: 122,
        },
      },
    });

    await sdk.query<ApiAssetCreateRequest>({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-kuzzle",
      body: {
        model: "Pallet",
        reference: "unlinked2",
        metadata: {
          depth: 83,
          width: 123,
        },
      },
    });

    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Pallet",
        metadataMappings: {
          depth: { type: "integer" },
          width: { type: "integer" },
          tareWeight: { type: "integer" },
        },
        defaultValues: {
          depth: 80,
          width: 120,
          tareWeight: 23,
        },
      },
    });

    await expect(
      sdk.query<ApiAssetGetRequest, ApiAssetGetResult>({
        controller: "device-manager/assets",
        action: "get",
        engineId: "engine-ayse",
        _id: "Pallet-unlinked1",
      }),
    ).resolves.toMatchObject<PartialDeep<ResponsePayload<ApiAssetGetResult>>>({
      result: {
        _source: {
          metadata: {
            depth: 82,
            width: 122,
            tareWeight: 23,
          },
        },
      },
    });

    await expect(
      sdk.query<ApiAssetGetRequest, ApiAssetGetResult>({
        controller: "device-manager/assets",
        action: "get",
        engineId: "engine-kuzzle",
        _id: "Pallet-unlinked2",
      }),
    ).resolves.toMatchObject<PartialDeep<ResponsePayload<ApiAssetGetResult>>>({
      result: {
        _source: {
          metadata: {
            depth: 83,
            width: 123,
            tareWeight: 23,
          },
        },
      },
    });
  });

  it("should add new metadata with null value if no default value set on linked assets in all engines", async () => {
    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Pallet",
        metadataMappings: {
          depth: { type: "integer" },
          width: { type: "integer" },
        },
        defaultValues: {
          depth: 80,
          width: 120,
        },
      },
    });

    await sdk.query<ApiAssetCreateRequest>({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-ayse",
      body: {
        model: "Pallet",
        reference: "unlinked3",
        metadata: {
          depth: 82,
          width: 122,
        },
      },
    });

    await sdk.query<ApiAssetCreateRequest>({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-kuzzle",
      body: {
        model: "Pallet",
        reference: "unlinked4",
        metadata: {
          depth: 83,
          width: 123,
        },
      },
    });

    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Pallet",
        metadataMappings: {
          depth: { type: "integer" },
          width: { type: "integer" },
          tareWeight: { type: "integer" },
        },
        defaultValues: {
          depth: 80,
          width: 120,
        },
      },
    });

    await expect(
      sdk.query<ApiAssetGetRequest, ApiAssetGetResult>({
        controller: "device-manager/assets",
        action: "get",
        engineId: "engine-ayse",
        _id: "Pallet-unlinked3",
      }),
    ).resolves.toMatchObject<PartialDeep<ResponsePayload<ApiAssetGetResult>>>({
      result: {
        _source: {
          metadata: {
            depth: 82,
            width: 122,
            tareWeight: null,
          },
        },
      },
    });

    await expect(
      sdk.query<ApiAssetGetRequest, ApiAssetGetResult>({
        controller: "device-manager/assets",
        action: "get",
        engineId: "engine-kuzzle",
        _id: "Pallet-unlinked4",
      }),
    ).resolves.toMatchObject<PartialDeep<ResponsePayload<ApiAssetGetResult>>>({
      result: {
        _source: {
          metadata: {
            depth: 83,
            width: 123,
            tareWeight: null,
          },
        },
      },
    });
  });

  it("should delete removed metadata on linked assets in all engines", async () => {
    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Pallet",
        metadataMappings: {
          depth: { type: "integer" },
          width: { type: "integer" },
          tareWeight: { type: "integer" },
        },
        defaultValues: {
          depth: 80,
          width: 120,
          tareWeight: 23,
        },
      },
    });

    await sdk.query<ApiAssetCreateRequest>({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-ayse",
      body: {
        model: "Pallet",
        reference: "unlinked5",
        metadata: {
          depth: 82,
          width: 122,
          tareWeight: 25,
        },
      },
    });

    await sdk.query<ApiAssetCreateRequest>({
      controller: "device-manager/assets",
      action: "create",
      engineId: "engine-kuzzle",
      body: {
        model: "Pallet",
        reference: "unlinked6",
        metadata: {
          depth: 83,
          width: 123,
          tareWeight: 23,
        },
      },
    });

    await sdk.query<ApiModelWriteAssetRequest>({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Pallet",
        metadataMappings: {
          depth: { type: "integer" },
          width: { type: "integer" },
        },
        defaultValues: {
          depth: 80,
          width: 120,
        },
      },
    });

    const asset5 = await sdk.query<ApiAssetGetRequest, ApiAssetGetResult>({
      controller: "device-manager/assets",
      action: "get",
      engineId: "engine-ayse",
      _id: "Pallet-unlinked5",
    });

    expect(asset5).toMatchObject<
      PartialDeep<ResponsePayload<ApiAssetGetResult>>
    >({
      result: {
        _source: {
          metadata: {
            depth: 82,
            width: 122,
          },
        },
      },
    });

    expect(asset5).not.toHaveProperty("result._source.metadata.tareWeight");

    const asset6 = await sdk.query<ApiAssetGetRequest, ApiAssetGetResult>({
      controller: "device-manager/assets",
      action: "get",
      engineId: "engine-kuzzle",
      _id: "Pallet-unlinked6",
    });

    expect(asset6).toMatchObject<
      PartialDeep<ResponsePayload<ApiAssetGetResult>>
    >({
      result: {
        _source: {
          metadata: {
            depth: 83,
            width: 123,
          },
        },
      },
    });

    expect(asset6).not.toHaveProperty("result._source.metadata.tareWeight");
  });
});
