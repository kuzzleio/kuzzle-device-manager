import { writeFileSync } from "node:fs";
import axios from "axios";
import { parse as csvParse } from "csv-parse/sync";

import { ApiAssetExportRequest, ApiAssetExportResult } from "../../../../index";

import { sendDummyTempPositionPayloads, setupHooks } from "../../../helpers";
import fixtures from "../../../fixtures/fixtures";

const assetCount = fixtures["engine-ayse"].assets.length / 2;
jest.setTimeout(10000);

function getExportedColums(row) {
  const parsedRow = csvParse(row)[0];

  return {
    model: parsedRow[0],
    reference: parsedRow[1],
    position: parsedRow[2],
    positionAccuracy: parsedRow[3],
    positionAltitude: parsedRow[4],
    temperatureExt: parsedRow[5],
    temperatureInt: parsedRow[6],
    temperatureWeather: parsedRow[7],
    lastMeasuredAt: parsedRow[8],
    lastMeasuredAtISO: parsedRow[9],
  };
}

describe("AssetsController:exportMeasures", () => {
  const sdk = setupHooks();

  it("should prepare export of different assets types and return a CSV as stream", async () => {
    await sendDummyTempPositionPayloads(sdk, [
      {
        deviceEUI: "warehouse",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
        // ? Use date now - 1s to ensure this asset are second in export
        measuredAt: Date.now() - 2000,
      },
      {
        deviceEUI: "linked2",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
        // ? Use date now to ensure this asset is first in export
        measuredAt: Date.now(),
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

    writeFileSync("./assets.csv", csv.join(""));

    expect(csv[0]).toBe(
      "Model,Reference,position,position.accuracy,position.altitude,temperatureExt,temperatureInt,temperatureWeather,lastMeasuredAt,lastMeasuredAtISO\n",
    );

    expect(csv).toHaveLength(assetCount + 1);

    const row1 = getExportedColums(csv[1]);

    expect(row1.model).toBe("Container");
    expect(typeof row1.reference).toBe("string");
    expect(typeof row1.position).toBe("string");
    expect(typeof parseFloat(row1.positionAccuracy)).toBe("number");
    expect(typeof parseFloat(row1.positionAltitude)).toBe("number");
    expect(typeof parseFloat(row1.temperatureExt)).toBe("number");
    expect(typeof parseFloat(row1.temperatureInt)).toBe("number");
    expect(typeof parseFloat(row1.temperatureWeather)).toBe("number");
    expect(typeof parseFloat(row1.lastMeasuredAt)).toBe("number");
    expect(typeof row1.lastMeasuredAtISO).toBe("string");

    const row2 = getExportedColums(csv[2]);

    expect(row2.model).toBe("Warehouse");
    expect(typeof row2.reference).toBe("string");
    expect(typeof row2.position).toBe("string");
    expect(typeof parseFloat(row2.positionAccuracy)).toBe("number");
    expect(typeof parseFloat(row2.positionAltitude)).toBe("number");
    expect(typeof parseFloat(row2.temperatureExt)).toBe("number");
    expect(typeof parseFloat(row2.temperatureInt)).toBe("number");
    expect(typeof parseFloat(row2.temperatureWeather)).toBe("number");
    expect(typeof parseFloat(row2.lastMeasuredAt)).toBe("number");
    expect(typeof row2.lastMeasuredAtISO).toBe("string");
  });
});
