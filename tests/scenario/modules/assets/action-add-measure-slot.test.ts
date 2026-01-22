import { ApiAssetAddMeasureSlotRequest } from "../../../../index";

import { beforeEachTruncateCollections } from "../../../hooks/collections";
import { beforeAllCreateEngines } from "../../../hooks/engines";
import { beforeEachLoadFixtures } from "../../../hooks/fixtures";

import { useSdk } from "../../../helpers";

jest.setTimeout(10000);

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

  const newSlot = {
    name: "temperatureInt2",
    type: "temperature",
  };
  const existingSlot = {
    name: "temperatureInt",
    type: "temperature",
  };
  const wrongMeasureType = {
    name: "wrongMeasure",
    type: "inexistingMeasureType",
  };
  it("should add a measure slot to the asset", async () => {
    await expect(
      sdk.query<ApiAssetAddMeasureSlotRequest>({
        controller: "device-manager/assets",
        action: "addMeasureSlot",
        engineId: "engine-ayse",
        _id: "Container-linked1",
        body: {
          measureSlot: newSlot,
        },
      }),
    ).resolves.toMatchObject({
      result: {
        _source: {
          measureSlots: expect.arrayContaining([newSlot]),
        },
      },
    });
  });
  it("should throw an error if the measure type does not exist", async () => {
    await expect(
      sdk.query<ApiAssetAddMeasureSlotRequest>({
        controller: "device-manager/assets",
        action: "addMeasureSlot",
        engineId: "engine-ayse",
        _id: "Container-linked1",
        body: {
          measureSlot: wrongMeasureType,
        },
      }),
    ).rejects.toMatchObject({
      message: `There is no measure of type ${wrongMeasureType.type} registered.`,
    });
  });
  it("should throw an error if the measure name already exists", async () => {
    await expect(
      sdk.query<ApiAssetAddMeasureSlotRequest>({
        controller: "device-manager/assets",
        action: "addMeasureSlot",
        engineId: "engine-ayse",
        _id: "Container-linked1",
        body: {
          measureSlot: existingSlot,
        },
      }),
    ).rejects.toMatchObject({
      message: `A measure slot with ${existingSlot.name} as a name already exists for Container-linked1`,
    });
  });
});
