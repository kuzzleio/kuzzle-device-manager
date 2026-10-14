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
        metadataMappings: {
          updSensorFloor: { type: "integer" },
          serialNumber: { referential: true },
        },
      },
    });

    await sdk.query({
      controller: "device-manager/devices",
      action: "create",
      index: "engine-ayse",
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

  const existingMappings = {
    updSensorFloor: { type: "integer" },
    serialNumber: { referential: true },
  };

  it("should add referential metadata and refresh the devices", async () => {
    await writeSensor();

    const updated = await updateSensor({
      metadataMappings: {
        ...existingMappings,
        operatingStatus: { referential: true },
      },
    });

    expect(updated._source.device).toMatchObject({
      measures: [{ name: "temperature", type: "temperature" }],
      metadataMappings: {
        ...existingMappings,
        operatingStatus: { referential: true },
      },
      metadataDetails: {
        serialNumber: { locales: { en: { friendlyName: "Serial number" } } },
        operatingStatus: { locales: { en: { friendlyName: "Status" } } },
      },
      defaultMetadata: { operatingStatus: "active" },
    });

    const { result: device } = await sdk.query({
      controller: "device-manager/devices",
      action: "get",
      index: "engine-ayse",
      _id: "UpdSensor-one",
    });

    expect(device._source.metadata).toEqual({
      serialNumber: "SN-1",
      updSensorFloor: 2,
      operatingStatus: "active",
    });
  });

  it("should accept changed details and keep them when omitted", async () => {
    await writeSensor();

    const updated = await updateSensor({
      metadataMappings: existingMappings,
      metadataDetails: { serialNumber: { icon: "barcode", locales: {} } },
    });

    expect(updated._source.device.metadataDetails.serialNumber).toMatchObject({
      icon: "barcode",
    });

    const kept = await updateSensor({ metadataMappings: existingMappings });

    expect(kept._source.device.metadataDetails.serialNumber).toMatchObject({
      icon: "barcode",
    });
  });

  it("should reject the removal or modification of an existing metadata", async () => {
    await writeSensor();

    await expect(
      updateSensor({
        metadataMappings: { updSensorFloor: { type: "integer" } },
      }),
    ).rejects.toThrow(/cannot be removed or modified: serialNumber/);

    await expect(
      updateSensor({
        metadataMappings: {
          ...existingMappings,
          updSensorFloor: { type: "keyword" },
        },
      }),
    ).rejects.toThrow(/cannot be removed or modified: updSensorFloor/);
  });

  it("should reject new inline metadata and other fields", async () => {
    await writeSensor();

    await expect(
      updateSensor({
        metadataMappings: {
          ...existingMappings,
          updSensorRoom: { type: "keyword" },
        },
      }),
    ).rejects.toThrow(/must come from the metadata referential.*updSensorRoom/);

    await expect(
      updateSensor({ metadataMappings: existingMappings, measures: [] }),
    ).rejects.toThrow(/forbidden fields: measures/);
  });

  it("should reject an unknown device model", async () => {
    await expect(
      sdk.query<ApiModelUpdateDeviceRequest>({
        controller: "device-manager/models",
        action: "updateDevice",
        model: "UpdUnknown",
        body: { metadataMappings: {} },
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
