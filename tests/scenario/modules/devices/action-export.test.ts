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
    lastMeasuredAtISO: parsedRow[12],
  };
}

describe("DevicesController:exportMeasures", () => {
  const sdk = setupHooks();

  it("should prepare export of different devices types and return a CSV as stream", async () => {
    const measureDate = Date.now();

    await sendDummyTempPayloads(sdk, [
      {
        deviceEUI: "linked1",
        temperature: 23.3,
        battery: 0.8,
        // ? Use date now - 1s to ensure this asset are second in export
        measuredAt: measureDate - 1000,
      },
    ]);
    await sendDummyTempPositionPayloads(sdk, [
      {
        deviceEUI: "linked2",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
        // ? Use date now to ensure this asset is first in export
        measuredAt: measureDate,
      },
    ]);
    await sdk.collection.refresh("engine-ayse", "devices");
    await sdk.collection.refresh("engine-ayse", "measures");
    const { result } = await sdk.query<
      ApiDeviceExportRequest,
      ApiDeviceExportResult
    >({
      controller: "device-manager/devices",
      action: "export",
      engineId: "engine-ayse",
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

    expect(csv).toHaveLength(deviceCount + 1);

    const header = csv.shift();

    expect(header).toBe(
      "Model,Reference,accelerationSensor.x,accelerationSensor.y,accelerationSensor.z,accelerationSensor.accuracy,battery,position,position.accuracy,position.altitude,temperature,lastMeasuredAt,lastMeasuredAtISO\n",
    );

    const rows = csv.map(getExportedColums);
    const sortedRows = [
      ...rows
        .filter((v) => typeof v !== "undefined")
        .sort((a, b) => b.lastMeasuredAt - a.lastMeasuredAt),
      ...rows.filter((v) => typeof v === "undefined"),
    ];

    const row1 = sortedRows[0];

    expect(row1.model).toBe("DummyTempPosition");
    expect(row1.reference).toBe("linked2");
    expect(parseFloat(row1.battery)).toBe(80);
    expect(row1.position).toBe('{"lat":42.2,"lon":2.42}');
    expect(parseFloat(row1.positionAccuracy)).toBe(2100);
    expect(parseFloat(row1.temperature)).toBe(23.3);
    expect(parseFloat(row1.lastMeasuredAt)).toBe(measureDate);
    expect(row1.lastMeasuredAtISO).toBe(new Date(measureDate).toISOString());

    expect(typeof parseFloat(row1.accelerationSensorX)).toBe("number");
    expect(typeof parseFloat(row1.accelerationSensorY)).toBe("number");
    expect(typeof parseFloat(row1.accelerationSensorZ)).toBe("number");
    expect(typeof parseFloat(row1.accelerationSensorAccuracy)).toBe("number");
    expect(typeof parseFloat(row1.positionAltitude)).toBe("number");

    const row2 = sortedRows[1];

    expect(row2.model).toBe("DummyTemp");
    expect(row2.reference).toBe("linked1");
    expect(parseFloat(row2.battery)).toBe(0.8);
    expect(parseFloat(row2.temperature)).toBe(23.3);
    expect(parseFloat(row2.lastMeasuredAt)).toBe(measureDate - 1000);
    expect(row2.lastMeasuredAtISO).toBe(
      new Date(measureDate - 1000).toISOString(),
    );

    expect(typeof parseFloat(row2.accelerationSensorX)).toBe("number");
    expect(typeof parseFloat(row2.accelerationSensorY)).toBe("number");
    expect(typeof parseFloat(row2.accelerationSensorZ)).toBe("number");
    expect(typeof parseFloat(row2.accelerationSensorAccuracy)).toBe("number");
    expect(typeof row2.position).toBe("string");
    expect(typeof parseFloat(row2.positionAccuracy)).toBe("number");
    expect(typeof parseFloat(row2.positionAltitude)).toBe("number");
  });
});
