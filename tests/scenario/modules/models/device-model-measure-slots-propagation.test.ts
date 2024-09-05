import {
  ApiDeviceCreateRequest,
  ApiDeviceCreateResult,
} from "../../../../lib/modules/device";
import {
  ApiModelWriteDeviceRequest,
  ApiModelWriteDeviceResult,
} from "../../../../lib/modules/model";
import { setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("Device model measure slots propagation", () => {
  const sdk = setupHooks();

  it("should update the embedded measure slots of existing devices with writeDevice", async () => {
    await sdk.query<ApiModelWriteDeviceRequest, ApiModelWriteDeviceResult>({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "Zigbee",
        measures: [{ type: "battery", name: "battery" }],
        metadataMappings: { network: { type: "keyword" } },
      },
    });

    const { result } = await sdk.query<
      ApiDeviceCreateRequest,
      ApiDeviceCreateResult
    >({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-kuzzle",
      body: {
        model: "Zigbee",
        reference: "MAYA1",
        metadata: { network: "yes" },
      },
    });

    expect(result).toMatchObject({
      _source: {
        measureSlots: [
          {
            name: "battery",
            type: "battery",
          },
        ],
      },
    });

    await sdk.query<ApiModelWriteDeviceRequest, ApiModelWriteDeviceResult>({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "Zigbee",
        metadataMappings: { network: { type: "keyword" } },
        measures: [
          {
            name: "battery",
            type: "battery",
          },
          {
            name: "temperature",
            type: "temperature",
          },
        ],
      },
    });

    await expect(
      sdk.document.get("engine-kuzzle", "devices", "Zigbee-MAYA1"),
    ).resolves.toMatchObject({
      _source: {
        measureSlots: [
          {
            name: "battery",
            type: "battery",
          },
          {
            name: "temperature",
            type: "temperature",
          },
        ],
      },
    });
  });
});
