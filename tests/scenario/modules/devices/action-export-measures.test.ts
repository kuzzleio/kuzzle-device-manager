import axios from "axios";

import { ApiDeviceExportMeasuresRequest } from "../../../../index";

import { sendPayloads, setupHooks } from "../../../helpers";
import { loadSecurityDefault } from "../../../hooks/security";

jest.setTimeout(10000);

describe("DevicesController:exportMeasures", () => {
  const sdk = setupHooks();

  beforeAll(async () => {
    await loadSecurityDefault(sdk);
  });

  it("should prepare an export and return a csv as stream", async () => {
    await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "linked2", temperature: 21 },

      { deviceEUI: "linked1", temperature: 42 },
      { deviceEUI: "linked1", temperature: 41 },
      { deviceEUI: "linked1", temperature: 40 },
      { deviceEUI: "linked1", temperature: 39 },
      { deviceEUI: "linked1", temperature: 38 },
      { deviceEUI: "linked1", temperature: 37 },
      { deviceEUI: "linked1", temperature: 42 },
      { deviceEUI: "linked1", temperature: 41 },
      { deviceEUI: "linked1", temperature: 40 },
      { deviceEUI: "linked1", temperature: 39 },
      { deviceEUI: "linked1", temperature: 38 },
      {
        deviceEUI: "linked1",
        temperature: 37,
        acceleration: {
          x: 1,
          y: 2.5,
          z: -1,
          accuracy: 0.1,
        },
        /**
         * Here we specify a measuredAt, because of a side effect in the decoder.
         * Sometimes the acceleration measurement would be registered earlier than the temperature's one.
         *
         * The +1sec is to ensure that those two measures will always remain the last ones.
         */
        measuredAt: Date.now() + 1000,
      },
    ]);
    await sdk.collection.refresh("engine-ayse", "measures");

    const { result } = await sdk.query<ApiDeviceExportMeasuresRequest>({
      controller: "device-manager/devices",
      action: "exportMeasures",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
    });

    const response = await axios.get("http://localhost:7512" + result.link, {
      responseType: "stream",
    });

    const csv = [];
    response.data.on("data", (chunk) => {
      csv.push(chunk.toString());
    });
    await new Promise((resolve) => {
      response.data.on("end", resolve);
    });

    expect(csv).toHaveLength(26);
    expect(csv[0]).toBe(
      "Payload Id,Measured At,Measure Type,Device Id,Device Model,Asset Id,Asset Model,temperature,accelerationSensor.x,accelerationSensor.y,accelerationSensor.z,accelerationSensor.accuracy,battery\n"
    );
    const [
      payloadId,
      measuredAt,
      tempMeasureType,
      deviceId,
      deviceModel,
      assetId,
      assetModel,
      temperature,
    ] = csv[1].split(",");
    const [
      ,
      ,
      accMeasureType,
      ,
      ,
      ,
      ,
      ,
      accelerationX,
      accelerationY,
      accelerationZ,
      accelerationAccuracy,
    ] = csv[2].split(",");

    expect(typeof payloadId).toBe("string");
    expect(typeof parseFloat(measuredAt)).toBe("number");
    expect(tempMeasureType).toBe("temperature");
    expect(deviceId).toBe("DummyTemp-linked1");
    expect(deviceModel).toBe("DummyTemp");
    expect(assetId).toBe("Container-linked1");
    expect(assetModel).toBe("Container");
    expect(parseFloat(temperature)).toBe(37);

    expect(accMeasureType).toBe("acceleration");
    expect(parseFloat(accelerationX)).toBe(1);
    expect(parseFloat(accelerationY)).toBe(2.5);
    expect(parseFloat(accelerationZ)).toBe(-1);
    expect(parseFloat(accelerationAccuracy)).toBe(0.1);
  });

  it("should generate a authenticated link", async () => {
    await sdk.auth.login("local", {
      username: "test-admin",
      password: "password",
    });

    await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "linked1", temperature: 37 },
    ]);
    await sdk.collection.refresh("engine-ayse", "measures");

    const { result } = await sdk.query<ApiDeviceExportMeasuresRequest>({
      controller: "device-manager/devices",
      action: "exportMeasures",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
    });

    const response = await axios.get("http://localhost:7512" + result.link, {
      responseType: "stream",
    });

    const csv = [];
    response.data.on("data", (chunk) => {
      csv.push(chunk.toString());
    });
    await new Promise((resolve) => {
      response.data.on("end", resolve);
    });

    expect(csv).toHaveLength(3);
    expect(csv[0]).toBe(
      "Payload Id,Measured At,Measure Type,Device Id,Device Model,Asset Id,Asset Model,temperature,accelerationSensor.x,accelerationSensor.y,accelerationSensor.z,accelerationSensor.accuracy,battery\n"
    );
  });
});
