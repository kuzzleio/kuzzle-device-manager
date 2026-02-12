import { beforeEachTruncateCollections } from "../../../hooks/collections";
import { beforeAllCreateEngines } from "../../../hooks/engines";
import { beforeEachLoadFixtures } from "../../../hooks/fixtures";

import { useSdk } from "../../../helpers";
import {
  ApiAssetAddMeasureSlotRequest,
  ApiAssetlinkDevicesRequest,
  ApiAssetRemoveMeasureSlotRequest,
} from "lib/modules/asset";

describe("AssetController: add measure slot", () => {
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

  const newSlot = { name: "temperatureInt2", type: "temperature" };
  const unknownSlotName = "unknownSlot";
  const modelSlotName = "temperatureInt";
  it("should remove a measure slot from the asset", async () => {
    await expect(
      sdk.query<ApiAssetAddMeasureSlotRequest>({
        controller: "device-manager/assets",
        action: "addMeasureSlot",
        engineId: "engine-ayse",
        _id: "Container-linked1",
        body: { measureSlot: newSlot },
      }),
    ).resolves.toMatchObject({
      result: { _source: { measureSlots: expect.arrayContaining([newSlot]) } },
    });

    await expect(
      sdk.query<ApiAssetRemoveMeasureSlotRequest>({
        controller: "device-manager/assets",
        action: "removeMeasureSlot",
        engineId: "engine-ayse",
        _id: "Container-linked1",
        body: { measureSlot: newSlot.name },
      }),
    ).resolves.toMatchObject({
      result: {
        _source: { measureSlots: expect.not.arrayContaining([newSlot]) },
      },
    });
  });
  it("should throw an error if the measure slot is linked", async () => {
    await expect(
      sdk.query<ApiAssetAddMeasureSlotRequest>({
        controller: "device-manager/assets",
        action: "addMeasureSlot",
        engineId: "engine-ayse",
        _id: "Container-linked1",
        body: { measureSlot: newSlot },
      }),
    ).resolves.toMatchObject({
      result: { _source: { measureSlots: expect.arrayContaining([newSlot]) } },
    });
    await sdk.query<ApiAssetlinkDevicesRequest>({
      controller: "device-manager/assets",
      action: "linkDevices",
      engineId: "engine-ayse",
      _id: "Container-linked1",
      body: {
        linkedMeasures: [
          {
            deviceId: "DummyTemp-unlinked1",
            measureSlots: [{ asset: newSlot.name, device: "temperature" }],
          },
        ],
      },
    });
    await expect(
      sdk.query<ApiAssetRemoveMeasureSlotRequest>({
        controller: "device-manager/assets",
        action: "removeMeasureSlot",
        engineId: "engine-ayse",
        _id: "Container-linked1",
        body: { measureSlot: newSlot.name },
      }),
    ).rejects.toMatchObject({
      message: `Measure slot ${newSlot.name} can not be removed as it is currently linked to DummyTemp-unlinked1`,
    });
  });
  it("should throw an error if the measure slot does not exist", async () => {
    await expect(
      sdk.query<ApiAssetRemoveMeasureSlotRequest>({
        controller: "device-manager/assets",
        action: "removeMeasureSlot",
        engineId: "engine-ayse",
        _id: "Container-linked1",
        body: { measureSlot: unknownSlotName },
      }),
    ).rejects.toMatchObject({
      message: `Asset Container-linked1 does not have a measure slot named ${unknownSlotName}`,
    });
  });
  it("should throw an error if the measure slot is set in the model", async () => {
    await expect(
      sdk.query<ApiAssetRemoveMeasureSlotRequest>({
        controller: "device-manager/assets",
        action: "removeMeasureSlot",
        engineId: "engine-ayse",
        _id: "Container-linked1",
        body: { measureSlot: modelSlotName },
      }),
    ).rejects.toMatchObject({
      message: `Measure slot ${modelSlotName} can not be removed as it is set in the Container model`,
    });
  });
});
