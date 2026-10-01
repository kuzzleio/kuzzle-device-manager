import { vi } from "vitest";
import {
  ApiModelUpdateDeviceRequest,
  ApiModelUpdateDeviceResult,
  ApiModelWriteDeviceRequest,
} from "../../../../lib/modules/model";
import { setupHooks } from "../../../helpers";

vi.setConfig({ testTimeout: 30000 });

describe("ModelsController:updateDevice", () => {
  const sdk = setupHooks();

  async function writeSensor() {
    await sdk.query<ApiModelWriteDeviceRequest>({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "UpdSensor",
        measures: [{ name: "temperature", type: "temperature" }],
        metadataMappings: { updSensorFloor: { type: "integer" } },
        metadata: { serialNumber: true },
      },
    });

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: {
        model: "UpdSensor",
        reference: "one",
        metadata: { serialNumber: "SN-1", updSensorFloor: 2 },
      },
    });
  }

  async function updateSensor(
    body: object,
  ): Promise<ApiModelUpdateDeviceResult> {
    const { result } = await sdk.query<
      ApiModelUpdateDeviceRequest,
      ApiModelUpdateDeviceResult
    >({
      controller: "device-manager/models",
      action: "updateDevice",
      model: "UpdSensor",
      body: body as ApiModelUpdateDeviceRequest["body"],
    });

    return result;
  }

  it("should add metadata references and refresh the devices", async () => {
    await writeSensor();

    const updated = await updateSensor({
      metadata: { serialNumber: true, operatingStatus: { icon: "plug" } },
    });

    expect(updated._source.device).toMatchObject({
      measures: [{ name: "temperature", type: "temperature" }],
      metadataReferences: {
        serialNumber: true,
        operatingStatus: { icon: "plug" },
      },
      metadataMappings: {
        updSensorFloor: { type: "integer" },
        serialNumber: { type: "keyword" },
        operatingStatus: { type: "keyword" },
      },
      metadataDetails: { operatingStatus: { icon: "plug" } },
      defaultMetadata: { operatingStatus: "active" },
    });

    const { result: device } = await sdk.query({
      controller: "device-manager/devices",
      action: "get",
      engineId: "engine-ayse",
      _id: "UpdSensor-one",
    });

    expect(device._source.metadata).toEqual({
      serialNumber: "SN-1",
      updSensorFloor: 2,
      operatingStatus: "active",
    });
  });

  it("should accept changed overrides of existing references", async () => {
    await writeSensor();

    const updated = await updateSensor({
      metadata: { serialNumber: { icon: "barcode" } },
    });

    expect(updated._source.device.metadataDetails.serialNumber).toMatchObject({
      icon: "barcode",
    });
  });

  it("should reject the removal of an existing reference", async () => {
    await writeSensor();

    await expect(
      updateSensor({ metadata: { operatingStatus: true } }),
    ).rejects.toThrow(/missing references: serialNumber/);
  });

  it("should reject any other field than metadata", async () => {
    await writeSensor();

    await expect(
      updateSensor({ metadata: { serialNumber: true }, measures: [] }),
    ).rejects.toThrow(/forbidden fields: measures/);

    await expect(
      updateSensor({
        metadata: { serialNumber: true },
        metadataMappings: { updSensorRoom: { type: "keyword" } },
      }),
    ).rejects.toThrow(/forbidden fields: metadataMappings/);
  });

  it("should reject an unknown device model", async () => {
    await expect(
      sdk.query<ApiModelUpdateDeviceRequest>({
        controller: "device-manager/models",
        action: "updateDevice",
        model: "UpdUnknown",
        body: { metadata: {} },
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
