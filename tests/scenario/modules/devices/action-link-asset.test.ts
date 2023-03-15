import { AssetContent, ApiDeviceLinkAssetRequest } from "../../../../index";

import { beforeEachTruncateCollections } from "../../../hooks/collections";
import { beforeAllCreateEngines } from "../../../hooks/engines";
import { beforeEachLoadFixtures } from "../../../hooks/fixtures";

import { useSdk, documentGet } from "../../../helpers";

jest.setTimeout(10000);

describe("DeviceController: receiveMeasure", () => {
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

  it("should link devices with selected measures to the asset", async () => {
    await sdk.query<ApiDeviceLinkAssetRequest>({
      controller: "device-manager/devices",
      action: "linkAsset",
      engineId: "engine-ayse",
      _id: "DummyTemp-unlinked1",
      assetId: "Container-unlinked1",
      body: {
        measureNames: [{ device: "temperature", asset: "temperatureExt" }],
      },
    });

    await expect(
      documentGet(sdk, "device-manager", "devices", "DummyTemp-unlinked1")
    ).resolves.toMatchObject({
      assetId: "Container-unlinked1",
      _kuzzle_info: {
        updater: "-1",
      },
    });
    await expect(
      documentGet(sdk, "engine-ayse", "devices", "DummyTemp-unlinked1")
    ).resolves.toMatchObject({
      assetId: "Container-unlinked1",
      _kuzzle_info: {
        updater: "-1",
      },
    });
    await expect(
      documentGet(sdk, "engine-ayse", "assets", "Container-unlinked1")
    ).resolves.toMatchObject({
      linkedDevices: [
        {
          _id: "DummyTemp-unlinked1",
          measureNames: [{ asset: "temperatureExt", device: "temperature" }],
        },
      ],
      _kuzzle_info: {
        updater: "-1",
      },
    });

    // Link a second device
    await sdk.query<ApiDeviceLinkAssetRequest>({
      controller: "device-manager/devices",
      action: "linkAsset",
      engineId: "engine-ayse",
      _id: "DummyTemp-unlinked2",
      assetId: "Container-unlinked1",
      body: {
        measureNames: [{ device: "temperature", asset: "temperatureInt" }],
      },
    });

    await expect(
      documentGet(sdk, "engine-ayse", "assets", "Container-unlinked1")
    ).resolves.toMatchObject({
      linkedDevices: [
        {
          _id: "DummyTemp-unlinked1",
          measureNames: [{ asset: "temperatureExt", device: "temperature" }],
        },
        {
          _id: "DummyTemp-unlinked2",
          measureNames: [{ asset: "temperatureInt", device: "temperature" }],
        },
      ],
      _kuzzle_info: {
        updater: "-1",
      },
    });
  });

  it("should update the link if it already exists", async () => {
    await sdk.query<ApiDeviceLinkAssetRequest>({
      controller: "device-manager/devices",
      action: "linkAsset",
      engineId: "engine-ayse",
      _id: "DummyTempPosition-unlinked3",
      assetId: "Container-linked1",
      body: {
        measureNames: [{ device: "temperature", asset: "temperatureInt" }],
      },
    });

    // Update the link with a new measure
    await sdk.query<ApiDeviceLinkAssetRequest>({
      controller: "device-manager/devices",
      action: "linkAsset",
      engineId: "engine-ayse",
      _id: "DummyTempPosition-unlinked3",
      assetId: "Container-linked1",
      body: {
        measureNames: [
          { device: "temperature", asset: "temperatureInt" },
          { device: "position", asset: "position" },
        ],
      },
    });

    await expect(
      documentGet(
        sdk,
        "device-manager",
        "devices",
        "DummyTempPosition-unlinked3"
      )
    ).resolves.toMatchObject({
      assetId: "Container-linked1",
    });
    await expect(
      documentGet(sdk, "engine-ayse", "devices", "DummyTempPosition-unlinked3")
    ).resolves.toMatchObject({
      assetId: "Container-linked1",
    });
    const container = await documentGet<AssetContent>(
      sdk,
      "engine-ayse",
      "assets",
      "Container-linked1"
    );

    expect(container.linkedDevices[1]).toMatchObject({
      _id: "DummyTempPosition-unlinked3",
      measureNames: [
        { asset: "temperatureInt", device: "temperature" },
        { asset: "position", device: "position" },
      ],
    });
  });

  it("should link a device measure implictely", async () => {
    await sdk.query<ApiDeviceLinkAssetRequest>({
      controller: "device-manager/devices",
      action: "linkAsset",
      engineId: "engine-ayse",
      _id: "DummyTemp-unlinked1",
      assetId: "Container-unlinked1",
      body: {
        measureNames: [{ device: "temperature", asset: "temperatureExt" }],
      },
    });

    await sdk.query<ApiDeviceLinkAssetRequest>({
      controller: "device-manager/devices",
      action: "linkAsset",
      engineId: "engine-ayse",
      _id: "DummyTempPosition-unlinked3",
      assetId: "Container-unlinked1",
      implicitMeasuresLinking: true,
      body: {
        measureNames: [{ device: "temperature", asset: "temperatureInt" }],
      },
    });

    await expect(
      documentGet(sdk, "engine-ayse", "assets", "Container-unlinked1")
    ).resolves.toMatchObject({
      linkedDevices: [
        {
          _id: "DummyTemp-unlinked1",
          measureNames: [{ asset: "temperatureExt", device: "temperature" }],
        },
        {
          _id: "DummyTempPosition-unlinked3",
          measureNames: [
            { asset: "temperatureInt", device: "temperature" },
            { asset: "position", device: "position" },
          ],
        },
      ],
    });
  });

  it("should throw an error if the device is linked to another asset", async () => {
    await expect(
      sdk.query<ApiDeviceLinkAssetRequest>({
        controller: "device-manager/devices",
        action: "linkAsset",
        engineId: "engine-ayse",
        _id: "DummyTemp-linked1",
        assetId: "Container-unlinked1",
        implicitMeasuresLinking: true,
      })
    ).rejects.toMatchObject({
      message: 'Device "DummyTemp-linked1" is already linked to another asset.',
    });
  });

  it("should throw an error when linking a measure already provided on the asset", async () => {
    await expect(
      sdk.query<ApiDeviceLinkAssetRequest>({
        controller: "device-manager/devices",
        action: "linkAsset",
        engineId: "engine-ayse",
        _id: "DummyTemp-unlinked1",
        assetId: "Container-linked1",
        body: {
          measureNames: [{ asset: "temperatureExt", device: "temperature" }],
        },
      })
    ).rejects.toMatchObject({
      message:
        'Measure name "temperatureExt" is already provided by another device on this asset.',
    });
  });

  it("should throw an error when the device is not attached to an engine", async () => {
    await expect(
      sdk.query<ApiDeviceLinkAssetRequest>({
        controller: "device-manager/devices",
        action: "linkAsset",
        engineId: "engine-ayse",
        _id: "DummyTemp-detached1",
        assetId: "Container-unlinked1",
        body: {
          measureNames: [{ asset: "temperatureExt", device: "temperature" }],
        },
      })
    ).rejects.toMatchObject({
      message: 'Device "DummyTemp-detached1" is not attached to an engine.',
    });
  });

  it("should throw an error when the wrong engine is provided", async () => {
    await expect(
      sdk.query<ApiDeviceLinkAssetRequest>({
        controller: "device-manager/devices",
        action: "linkAsset",
        engineId: "engine-kuzzle",
        _id: "DummyTemp-unlinked1",
        assetId: "Container-unlinked1",
        body: {
          measureNames: [{ asset: "temperatureExt", device: "temperature" }],
        },
      })
    ).rejects.toMatchObject({
      message:
        'Device "DummyTemp-unlinked1" is not attached to the specified engine.',
    });
  });

  it("should throw an error when the asset does not exists", async () => {
    await expect(
      sdk.query<ApiDeviceLinkAssetRequest>({
        controller: "device-manager/devices",
        action: "linkAsset",
        engineId: "engine-ayse",
        _id: "DummyTemp-unlinked1",
        assetId: "Container-notexisting",
        body: {
          measureNames: [{ asset: "temperatureExt", device: "temperature" }],
        },
      })
    ).rejects.toMatchObject({
      message:
        'Document "Container-notexisting" not found in "engine-ayse":"assets".',
    });
  });

  it("should throw an error if no measures are selected", async () => {
    await expect(
      sdk.query<ApiDeviceLinkAssetRequest>({
        controller: "device-manager/devices",
        action: "linkAsset",
        engineId: "engine-ayse",
        _id: "DummyTempPosition-unlinked3",
        assetId: "Container-unlinked1",
      })
    ).rejects.toMatchObject({
      message:
        'You must provide at least one measure name or set "implicitMeasuresLinking" to true.',
    });
  });
});
