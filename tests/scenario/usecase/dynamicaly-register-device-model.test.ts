import {
  ApiModelWriteDeviceRequest,
  ApiModelWriteDeviceResult,
  ApiDeviceCreateRequest,
  ApiDeviceCreateResult,
  ApiDeviceReceiveMeasuresRequest,
  ApiDeviceReceiveMeasuresResult,
  ApiDeviceGetLastMeasuresRequest,
  ApiDeviceGetLastMeasuresResult,
} from "../../../index";

import { setupHooks } from "../../helpers";
const sdk = setupHooks();
jest.setTimeout(10000);

describe("DeviceScenario: dynamicaly register device model and receive a measure", () => {
  it("register a new device model, create a device from this model and receive a formated measure", async () => {
    await sdk.query<ApiModelWriteDeviceRequest, ApiModelWriteDeviceResult>({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "Enginko",
        measures: [
          { name: "temperatureInternal", type: "temperature" },
          { name: "temperatureExternal", type: "temperature" },
        ],
      },
    });

    await sdk.query<ApiDeviceCreateRequest, ApiDeviceCreateResult>({
      controller: "device-manager/devices",
      action: "create",
      engineId: "engine-ayse",
      body: {
        model: "Enginko",
        reference: "24BA98",
      },
    });

    await sdk.query<
      ApiDeviceReceiveMeasuresRequest,
      ApiDeviceReceiveMeasuresResult
    >({
      controller: "device-manager/devices",
      action: "receiveMeasures",
      engineId: "engine-ayse",
      _id: "Enginko-24BA98",
      body: {
        measures: [
          {
            measureName: "temperatureInternal",
            type: "temperature",
            values: {
              temperature: 28,
            },
          },
          {
            measureName: "temperatureExternal",
            type: "temperature",
            values: {
              temperature: 12,
            },
          },
        ],
      },
    });
    await sdk.collection.refresh("engine-ayse", "measures");

    const { result } = await sdk.query<
      ApiDeviceGetLastMeasuresRequest,
      ApiDeviceGetLastMeasuresResult
    >({
      _id: "Enginko-24BA98",
      controller: "device-manager/devices",
      action: "getLastMeasures",
      engineId: "engine-ayse",
    });

    expect(result).toMatchObject({
      temperatureInternal: {
        values: {
          temperature: 28,
        },
      },
      temperatureExternal: {
        values: {
          temperature: 12,
        },
      },
    });
  });
});
