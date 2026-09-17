import { ApiDeviceUpdateMeasureSlotDisplayNameRequest } from "lib/modules/device";

import { setupHooks } from "../../../helpers";

describe("DeviceController: update measure slot display name", () => {
  const sdk = setupHooks();

  const existingSlotName = "temperature";
  const unknownSlotName = "unknownSlot";
  const displayName = {
    en: "Temperature",
    fr: "Température",
  };

  it("should update the display name of an existing measure slot", async () => {
    await expect(
      sdk.query<ApiDeviceUpdateMeasureSlotDisplayNameRequest>({
        controller: "device-manager/devices",
        action: "updateMeasureSlotDisplayName",
        engineId: "engine-ayse",
        _id: "DummyTemp-unlinked1",
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
      sdk.query<ApiDeviceUpdateMeasureSlotDisplayNameRequest>({
        controller: "device-manager/devices",
        action: "updateMeasureSlotDisplayName",
        engineId: "engine-ayse",
        _id: "DummyTemp-unlinked1",
        body: { measureSlot: unknownSlotName, displayName },
      }),
    ).rejects.toMatchObject({
      message: `Device DummyTemp-unlinked1 does not have a measure slot named ${unknownSlotName}`,
    });
  });
});
