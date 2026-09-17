import { beforeEachTruncateCollections } from "../../../hooks/collections";
import { beforeAllCreateEngines } from "../../../hooks/engines";
import { beforeEachLoadFixtures } from "../../../hooks/fixtures";

import { useSdk } from "../../../helpers";
import { ApiAssetUpdateMeasureSlotDisplayNameRequest } from "lib/modules/asset";

describe("AssetController: update measure slot display name", () => {
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

  const existingSlotName = "temperatureInt";
  const unknownSlotName = "unknownSlot";
  const displayName = {
    en: "Internal temperature",
    fr: "Température intérieure",
  };

  it("should update the display name of an existing measure slot", async () => {
    await expect(
      sdk.query<ApiAssetUpdateMeasureSlotDisplayNameRequest>({
        controller: "device-manager/assets",
        action: "updateMeasureSlotDisplayName",
        engineId: "engine-ayse",
        _id: "Container-linked1",
        body: { measureSlot: existingSlotName, displayName },
      }),
    ).resolves.toMatchObject({
      result: {
        _source: {
          measureSlots: expect.arrayContaining([
            expect.objectContaining({
              name: existingSlotName,
              displayName,
            }),
          ]),
        },
      },
    });
  });

  it("should throw an error if the measure slot does not exist", async () => {
    await expect(
      sdk.query<ApiAssetUpdateMeasureSlotDisplayNameRequest>({
        controller: "device-manager/assets",
        action: "updateMeasureSlotDisplayName",
        engineId: "engine-ayse",
        _id: "Container-linked1",
        body: { measureSlot: unknownSlotName, displayName },
      }),
    ).rejects.toMatchObject({
      message: `Asset Container-linked1 does not have a measure slot named ${unknownSlotName}`,
    });
  });
});
