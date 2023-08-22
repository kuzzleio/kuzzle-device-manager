import axios from "axios";
import { parse as csvParse } from "csv-parse/sync";

import {
  ApiDeviceExportRequest,
  ApiDeviceExportResult,
} from "../../../../index";

import {
  sendDummyTempPositionPayloads,
  sendDummyTempPayloads,
  setupHooks,
} from "../../../helpers";
import fixtures from "../../../fixtures/fixtures";

const deviceCount = fixtures["engine-ayse"].devices.length / 2;
jest.setTimeout(10000);

function getExportedColums(row) {
  const parsedRow = csvParse(row)[0];

  return {
    model: parsedRow[0],
    reference: parsedRow[1],
    accelerationSensorX: parsedRow[2],
    accelerationSensorY: parsedRow[3],
    accelerationSensorZ: parsedRow[4],
    accelerationSensorAccuracy: parsedRow[5],
    battery: parsedRow[6],
    position: parsedRow[7],
    positionAccuracy: parsedRow[8],
    positionAltitude: parsedRow[9],
    temperature: parsedRow[10],
    lastMeasuredAt: parsedRow[11],
  };
}

describe("AssetsController:exportMeasures", () => {
  const sdk = setupHooks();

  it("should prepare export of different devices types and return a CSV as stream", async () => {
    await sendDummyTempPayloads(sdk, [
      {
        deviceEUI: "linked1",
        temperature: 23.3,
        battery: 0.8,
        // ? Use date now - 1s to ensure this asset are second in export
        measuredAt: Date.now() - 1000,
      },
    ]);
    await sendDummyTempPositionPayloads(sdk, [
      {
        deviceEUI: "linked2",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
        // ? Use date now to ensure this asset is first in export
        measuredAt: Date.now(),
      },
    ]);
    await sdk.collection.refresh("engine-ayse", "devices");
    const { result } = await sdk.query<
      ApiDeviceExportRequest,
      ApiDeviceExportResult
    >({
      controller: "device-manager/devices",
      action: "export",
      engineId: "engine-ayse",
      body: {
        sort: { lastMeasuredAt: "desc" },
      },
    });

    expect(typeof result.link).toBe("string");

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

    expect(csv[0]).toBe(
      "Model,Reference,accelerationSensor.x,accelerationSensor.y,accelerationSensor.z,accelerationSensor.accuracy,battery,position,position.accuracy,position.altitude,temperature,lastMeasuredAt\n"
    );

    expect(csv).toHaveLength(deviceCount + 1);

    const row1 = getExportedColums(csv[1]);

    expect(row1.model).toBe("DummyTempPosition");
    expect(typeof row1.reference).toBe("string");
    expect(typeof parseFloat(row1.accelerationSensorX)).toBe("number");
    expect(typeof parseFloat(row1.accelerationSensorY)).toBe("number");
    expect(typeof parseFloat(row1.accelerationSensorZ)).toBe("number");
    expect(typeof parseFloat(row1.accelerationSensorAccuracy)).toBe("number");
    expect(typeof parseFloat(row1.battery)).toBe("number");
    expect(typeof row1.position).toBe("string");
    expect(typeof parseFloat(row1.positionAccuracy)).toBe("number");
    expect(typeof parseFloat(row1.positionAltitude)).toBe("number");
    expect(typeof parseFloat(row1.temperature)).toBe("number");
    expect(typeof parseFloat(row1.lastMeasuredAt)).toBe("number");

    const row2 = getExportedColums(csv[1]);

    expect(row2.model).toBe("DummyTempPosition");
    expect(typeof row2.reference).toBe("string");
    expect(typeof parseFloat(row2.accelerationSensorX)).toBe("number");
    expect(typeof parseFloat(row2.accelerationSensorY)).toBe("number");
    expect(typeof parseFloat(row2.accelerationSensorZ)).toBe("number");
    expect(typeof parseFloat(row2.accelerationSensorAccuracy)).toBe("number");
    expect(typeof parseFloat(row2.battery)).toBe("number");
    expect(typeof row2.position).toBe("string");
    expect(typeof parseFloat(row2.positionAccuracy)).toBe("number");
    expect(typeof parseFloat(row2.positionAltitude)).toBe("number");
    expect(typeof parseFloat(row2.temperature)).toBe("number");
    expect(typeof parseFloat(row2.lastMeasuredAt)).toBe("number");
  });
});
