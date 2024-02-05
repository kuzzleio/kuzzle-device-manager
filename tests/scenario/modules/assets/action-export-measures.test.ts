import { JSONObject } from "kuzzle";
import axios from "axios";
import { parse as csvParse } from "csv-parse/sync";

import { ApiAssetExportMeasuresRequest } from "../../../../index";

import { sendPayloads, setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("AssetsController:exportMeasures", () => {
  const sdk = setupHooks();

  it("should support elasticsearch and koncorde query", async () => {
    async function testQuery(
      query: JSONObject,
      lang: ApiAssetExportMeasuresRequest["lang"],
    ) {
      const { result } = await sdk.query<ApiAssetExportMeasuresRequest>({
        controller: "device-manager/assets",
        action: "exportMeasures",
        engineId: "engine-ayse",
        _id: "Container-linked2",
        body: {
          query,
        },
        lang,
      });

      return axios.get("http://localhost:7512" + result.link, {
        // ? accept all status minor than 500 to accept BadRequest error
        validateStatus: (status) => status < 500,
      });
    }

    const esError = await testQuery(
      {
        equals: { type: "temperature" },
      },
      "elasticsearch",
    );
    expect(esError.status).toBe(400);

    const esResponse = await testQuery(
      {
        term: { type: "temperature" },
      },
      "elasticsearch",
    );
    expect(esResponse.status).toBe(200);

    const koncordeResponse = await testQuery(
      {
        equals: { type: "temperature" },
      },
      "koncorde",
    );
    expect(koncordeResponse.status).toBe(200);
  });

  it("should prepare export of temperature measures and return a CSV as stream", async () => {
    await sendPayloads(sdk, "dummy-temp-position", [
      {
        deviceEUI: "linked2",
        temperature: 23.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
      },
      {
        deviceEUI: "linked2",
        temperature: 42.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
      },
      {
        deviceEUI: "linked2",
        temperature: 21.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
      },
      {
        deviceEUI: "linked2",
        temperature: 17.3,
        location: { lat: 42.2, lon: 2.42, accuracy: 2100 },
        battery: 0.8,
      },
    ]);
    await sendPayloads(sdk, "dummy-temp", [
      { deviceEUI: "linked1", temperature: 42 },
      { deviceEUI: "linked1", temperature: 37 },
    ]);
    await sdk.collection.refresh("engine-ayse", "measures");

    const { result } = await sdk.query<ApiAssetExportMeasuresRequest>({
      controller: "device-manager/assets",
      action: "exportMeasures",
      engineId: "engine-ayse",
      _id: "Container-linked2",
      type: "temperature",
      lang: "koncorde",
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

    expect(csv).toHaveLength(5);
    expect(csv[0]).toBe(
      "Payload Id,Measured At,Measure Type,Device Id,Device Model,Asset Id,Asset Model,temperatureExt,temperatureInt,position,position.accuracy,position.altitude,temperatureWeather\n",
    );
    const [
      payloadId,
      measuredAt,
      measureType,
      deviceId,
      deviceModel,
      assetId,
      assetModel,
      temperatureExt,
      temperatureInt,
      position,
      temperatureWeather,
    ] = csvParse(csv[1])[0];

    expect(typeof payloadId).toBe("string");
    expect(typeof parseFloat(measuredAt)).toBe("number");
    expect(measureType).toBe("temperature");
    expect(deviceId).toBe("DummyTempPosition-linked2");
    expect(deviceModel).toBe("DummyTempPosition");
    expect(assetId).toBe("Container-linked2");
    expect(assetModel).toBe("Container");
    expect(temperatureExt).toBe("17.3");
    expect(temperatureInt).toBe("");
    expect(position).toBe("");
    expect(temperatureWeather).toBe("");
  });
});
