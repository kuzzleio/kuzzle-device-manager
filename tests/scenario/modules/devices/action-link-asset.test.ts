import { AssetContent, ApiDeviceLinkAssetsRequest } from "../../../../index";

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
    await sdk.query<ApiDeviceLinkAssetsRequest>({
      controller: "device-manager/devices",
      action: "linkAssets",
      engineId: "engine-ayse",
      _id: "DummyTemp-unlinked1",
      body: {
        linkedMeasures: [
          {
            assetId: "Container-unlinked1",
            measureSlots: [{ device: "temperature", asset: "temperatureExt" }],
          },
        ],
      },
    });

    await expect(
      documentGet(sdk, "engine-ayse", "devices", "DummyTemp-unlinked1"),
    ).resolves.toEqual(
      expect.objectContaining({
        linkedMeasures: expect.arrayContaining([
          {
            assetId: "Container-unlinked1",
            measureSlots: [
              {
                asset: "temperatureExt",
                device: "temperature",
              },
            ],
          },
        ]),
      }),
    );
    await expect(
      documentGet(sdk, "engine-ayse", "assets", "Container-unlinked1"),
    ).resolves.toMatchObject({
      linkedMeasures: [
        {
          deviceId: "DummyTemp-unlinked1",
          measureSlots: [
            {
              asset: "temperatureExt",
              device: "temperature",
            },
          ],
        },
      ],
      _kuzzle_info: {
        updater: "-1",
      },
    });

    // Link a second device
    await sdk.query<ApiDeviceLinkAssetsRequest>({
      controller: "device-manager/devices",
      action: "linkAssets",
      engineId: "engine-ayse",
      _id: "DummyTemp-unlinked2",
      body: {
        linkedMeasures: [
          {
            assetId: "Container-unlinked1",

            measureSlots: [
              {
                device: "temperature",
                asset: "temperatureInt",
              },
            ],
          },
        ],
      },
    });

    await expect(
      documentGet(sdk, "engine-ayse", "assets", "Container-unlinked1"),
    ).resolves.toMatchObject({
      linkedMeasures: [
        {
          deviceId: "DummyTemp-unlinked1",
          measureSlots: [{ asset: "temperatureExt", device: "temperature" }],
        },
        {
          deviceId: "DummyTemp-unlinked2",
          measureSlots: [{ asset: "temperatureInt", device: "temperature" }],
        },
      ],
      _kuzzle_info: {
        updater: "-1",
      },
    });
  });

  it("should update the link if it already exists", async () => {
    await sdk.query<ApiDeviceLinkAssetsRequest>({
      controller: "device-manager/devices",
      action: "linkAssets",
      engineId: "engine-ayse",
      _id: "DummyTempPosition-unlinked3",
      body: {
        linkedMeasures: [
          {
            assetId: "Container-linked1",
            measureSlots: [
              {
                device: "temperature",
                asset: "temperatureInt",
              },
            ],
          },
        ],
      },
    });

    // Update the link with a new measure
    await sdk.query<ApiDeviceLinkAssetsRequest>({
      controller: "device-manager/devices",
      action: "linkAssets",
      engineId: "engine-ayse",
      _id: "DummyTempPosition-unlinked3",
      body: {
        linkedMeasures: [
          {
            assetId: "Container-linked1",
            measureSlots: [{ device: "position", asset: "position" }],
          },
        ],
      },
    });

    await expect(
      documentGet(sdk, "engine-ayse", "devices", "DummyTempPosition-unlinked3"),
    ).resolves.toMatchObject({
      linkedMeasures: expect.arrayContaining([
        {
          assetId: "Container-linked1",
          measureSlots: expect.arrayContaining([
            {
              device: "temperature",
              asset: "temperatureInt",
            },
            { device: "position", asset: "position" },
          ]),
        },
      ]),
    });
    const container = await documentGet<AssetContent>(
      sdk,
      "engine-ayse",
      "assets",
      "Container-linked1",
    );

    expect(container.linkedMeasures[1]).toMatchObject({
      deviceId: "DummyTempPosition-unlinked3",
      measureSlots: expect.arrayContaining([
        { asset: "temperatureInt", device: "temperature" },
        { asset: "position", device: "position" },
      ]),
    });
  });

  it("should link a device measure implictely", async () => {
    await sdk.query<ApiDeviceLinkAssetsRequest>({
      controller: "device-manager/devices",
      action: "linkAssets",
      engineId: "engine-ayse",
      _id: "DummyTemp-unlinked1",
      body: {
        linkedMeasures: [
          {
            assetId: "Container-unlinked1",
            measureSlots: [
              {
                device: "temperature",
                asset: "temperatureExt",
              },
            ],
          },
        ],
      },
    });

    await sdk.query<ApiDeviceLinkAssetsRequest>({
      controller: "device-manager/devices",
      action: "linkAssets",
      engineId: "engine-ayse",
      _id: "DummyTempPosition-unlinked3",
      body: {
        linkedMeasures: [
          {
            assetId: "Container-unlinked1",
            implicitMeasuresLinking: true,
            measureSlots: [
              {
                asset: "temperatureInt",
                device: "temperature",
              },
            ],
          },
        ],
      },
    });

    await expect(
      documentGet(sdk, "engine-ayse", "assets", "Container-unlinked1"),
    ).resolves.toMatchObject({
      linkedMeasures: expect.arrayContaining([
        {
          deviceId: "DummyTemp-unlinked1",
          measureSlots: [
            {
              asset: "temperatureExt",
              device: "temperature",
            },
          ],
        },
        {
          deviceId: "DummyTempPosition-unlinked3",
          measureSlots: [
            {
              asset: "temperatureInt",
              device: "temperature",
            },
            { asset: "position", device: "position" },
          ],
        },
      ]),
    });
  });

  it("should link a device to several assets", async () => {
    await sdk.query<ApiDeviceLinkAssetsRequest>({
      controller: "device-manager/devices",
      action: "linkAssets",
      engineId: "engine-ayse",
      _id: "DummyTempPosition-unlinked3",
      body: {
        linkedMeasures: [
          {
            assetId: "Container-unlinked1",
            measureSlots: [
              {
                device: "temperature",
                asset: "temperatureExt",
              },
            ],
          },
          {
            assetId: "Container-linked1",
            measureSlots: [
              {
                device: "position",
                asset: "position",
              },
            ],
          },
        ],
      },
    });

    await expect(
      documentGet(sdk, "engine-ayse", "devices", "DummyTempPosition-unlinked3"),
    ).resolves.toMatchObject({
      linkedMeasures: expect.arrayContaining([
        {
          assetId: "Container-unlinked1",
          measureSlots: [
            {
              device: "temperature",
              asset: "temperatureExt",
            },
          ],
        },
        {
          assetId: "Container-linked1",
          measureSlots: [{ device: "position", asset: "position" }],
        },
      ]),
    });
  });

  it("should throw an error when linking a measure already provided on the asset", async () => {
    await expect(
      sdk.query<ApiDeviceLinkAssetsRequest>({
        controller: "device-manager/devices",
        action: "linkAssets",
        engineId: "engine-ayse",
        _id: "DummyTemp-unlinked1",
        body: {
          linkedMeasures: [
            {
              assetId: "Container-linked1",
              measureSlots: [
                {
                  asset: "temperatureExt",
                  device: "temperature",
                },
              ],
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      message:
        'Measure name "temperatureExt" is already provided by another device on this asset.',
    });
  });

  it("should throw an error when the device is not attached to an engine", async () => {
    await expect(
      sdk.query<ApiDeviceLinkAssetsRequest>({
        controller: "device-manager/devices",
        action: "linkAssets",
        engineId: "engine-ayse",
        _id: "DummyTemp-detached1",
        body: {
          linkedMeasures: [
            {
              assetId: "Container-unlinked1",
              measureSlots: [
                {
                  asset: "temperatureExt",
                  device: "temperature",
                },
              ],
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      message: 'Device "DummyTemp-detached1" is not attached to an engine.',
    });
  });

  it("should throw an error when the wrong engine is provided", async () => {
    await expect(
      sdk.query<ApiDeviceLinkAssetsRequest>({
        controller: "device-manager/devices",
        action: "linkAssets",
        engineId: "engine-kuzzle",
        _id: "DummyTemp-unlinked1",
        body: {
          linkedMeasures: [
            {
              assetId: "Container-unlinked1",
              measureSlots: [
                {
                  asset: "temperatureExt",
                  device: "temperature",
                },
              ],
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      message:
        'Device "DummyTemp-unlinked1" is not attached to the specified engine.',
    });
  });

  it("should throw an error when the asset does not exists", async () => {
    await expect(
      sdk.query<ApiDeviceLinkAssetsRequest>({
        controller: "device-manager/devices",
        action: "linkAssets",
        engineId: "engine-ayse",
        _id: "DummyTemp-unlinked1",
        body: {
          linkedMeasures: [
            {
              assetId: "Container-notexisting",
              measureSlots: [
                {
                  asset: "temperatureExt",
                  device: "temperature",
                },
              ],
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      message:
        'Document "Container-notexisting" not found in "engine-ayse":"assets".',
    });
  });

  it("should throw an error if no measures are selected", async () => {
    await expect(
      sdk.query<ApiDeviceLinkAssetsRequest>({
        controller: "device-manager/devices",
        action: "linkAssets",
        engineId: "engine-ayse",
        _id: "DummyTempPosition-unlinked3",
        body: {
          linkedMeasures: [
            {
              assetId: "Container-unlinked1",
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      message:
        'You must provide at least one measure name or set "implicitMeasuresLinking" to true.',
    });

    await expect(
      sdk.query<ApiDeviceLinkAssetsRequest>({
        controller: "device-manager/devices",
        action: "linkAssets",
        engineId: "engine-ayse",
        _id: "DummyTemp-linked1",
        body: {
          linkedMeasures: [
            {
              assetId: "Container-unlinked1",
              implicitMeasuresLinking: true,
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      message:
        'No free compatible measure slot available to link device "DummyTemp-linked1" to asset "Container-unlinked1".',
    });
  });
});
