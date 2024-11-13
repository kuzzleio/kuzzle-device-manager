import { writeFileSync } from "node:fs";
import axios from "axios";
import { parse as csvParse } from "csv-parse/sync";

import { ApiAssetExportRequest, ApiAssetExportResult } from "../../../../index";

import { sendDummyTempPositionPayloads, setupHooks } from "../../../helpers";
import fixtures from "../../../fixtures/fixtures";

const assetCount = fixtures["engine-ayse"].assets.length / 2;
jest.setTimeout(10000);

function getExportedColums(row: string) {
  const parsedRow = csvParse(row)[0];

  return {
    model: parsedRow[0],
    reference: parsedRow[1],
    brightnessLumens: parsedRow[2],
    co2: parsedRow[3],
    humidity: parsedRow[4],
    illuminance: parsedRow[5],
    magiculeExt: parsedRow[6],
    magiculeInt: parsedRow[7],
    position: parsedRow[8],
    positionAccuracy: parsedRow[9],
    positionAltitude: parsedRow[10],
    powerConsumptionWatt: parsedRow[11],
    temperature: parsedRow[12],
    temperatureExt: parsedRow[13],
    temperatureInt: parsedRow[14],
    temperatureWeather: parsedRow[15],
    lastMeasuredAt: parsedRow[16],
    lastMeasuredAtISO: parsedRow[17],
  };
}

describe("AssetsController:exportMeasures", () => {
  const sdk = setupHooks();

  it("should prepare export of different assets types and return a CSV as stream", async () => {
    const measureDate = Date.now();

    await sendDummyTempPositionPayloads(sdk, [
      {
        deviceEUI: "warehouse",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
        // ? Use date now - 1s to ensure this asset are second in export
        measuredAt: measureDate - 2000,
      },
      {
        deviceEUI: "linked2",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
        // ? Use date now to ensure this asset is first in export
        measuredAt: measureDate,
      },
    ]);
    await sdk.collection.refresh("engine-ayse", "assets");
    await sdk.collection.refresh("engine-ayse", "measures");
    const { result } = await sdk.query<
      ApiAssetExportRequest,
      ApiAssetExportResult
    >({
      controller: "device-manager/assets",
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

    writeFileSync("./assets.csv", csv.join(""));

    expect(csv).toHaveLength(assetCount + 1);

    const header = csv.shift();

    expect(header).toBe(
      "Model,Reference,brightness.lumens,co2,humidity,illuminance,magiculeExt,magiculeInt,position,position.accuracy,position.altitude,powerConsumption.watt,temperature,temperatureExt,temperatureInt,temperatureWeather,lastMeasuredAt,lastMeasuredAtISO\n",
    );

    const rows = csv
      .map(getExportedColums)
      .sort((a, b) => b.lastMeasuredAt - a.lastMeasuredAt);

    const row1 = rows[0];

    expect(row1.model).toBe("Container");
    expect(row1.reference).toBe("linked2");
    expect(row1.position).toBe('{"lat":42.2,"lon":2.42}');
    expect(parseFloat(row1.positionAccuracy)).toBe(2100);
    expect(parseFloat(row1.temperatureExt)).toBe(23.3);
    expect(parseFloat(row1.lastMeasuredAt)).toBe(measureDate);
    expect(row1.lastMeasuredAtISO).toBe(new Date(measureDate).toISOString());

    expect(typeof parseFloat(row1.brightnessLumens)).toBe("number");
    expect(typeof parseFloat(row1.co2)).toBe("number");
    expect(typeof parseFloat(row1.humidity)).toBe("number");
    expect(typeof parseFloat(row1.illuminance)).toBe("number");
    expect(typeof parseFloat(row1.positionAltitude)).toBe("number");
    expect(typeof parseFloat(row1.powerConsumptionWatt)).toBe("number");
    expect(typeof parseFloat(row1.temperature)).toBe("number");
    expect(typeof parseFloat(row1.temperatureInt)).toBe("number");
    expect(typeof parseFloat(row1.temperatureWeather)).toBe("number");

    const row2 = rows[1];

    expect(row2.model).toBe("Warehouse");
    expect(row2.reference).toBe("linked");
    expect(row2.position).toBe('{"lat":42.2,"lon":2.42}');
    expect(parseFloat(row2.positionAccuracy)).toBe(2100);
    expect(parseFloat(row2.lastMeasuredAt)).toBe(measureDate - 2000);
    expect(row2.lastMeasuredAtISO).toBe(
      new Date(measureDate - 2000).toISOString(),
    );

    expect(typeof parseFloat(row2.brightnessLumens)).toBe("number");
    expect(typeof parseFloat(row2.co2)).toBe("number");
    expect(typeof parseFloat(row2.humidity)).toBe("number");
    expect(typeof parseFloat(row2.illuminance)).toBe("number");
    expect(typeof parseFloat(row2.positionAltitude)).toBe("number");
    expect(typeof parseFloat(row2.powerConsumptionWatt)).toBe("number");
    expect(typeof parseFloat(row2.temperature)).toBe("number");
    expect(typeof parseFloat(row2.temperatureExt)).toBe("number");
    expect(typeof parseFloat(row2.temperatureInt)).toBe("number");
    expect(typeof parseFloat(row2.temperatureWeather)).toBe("number");
  });
});
