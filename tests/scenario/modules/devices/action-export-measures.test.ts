import axios from "axios";

import { ApiDeviceExportMeasuresRequest } from "../../../../index";

import { sendPayloads, setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("DevicesController:exportMeasures", () => {
  const sdk = setupHooks();

  it("should save an export and return an ID", async () => {
    await sendPayloads(sdk, "dummy-temp", [
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
      { deviceEUI: "linked1", temperature: 37 },
    ]);
    await sdk.collection.refresh("engine-ayse", "measures");

    const { result } = await sdk.query<ApiDeviceExportMeasuresRequest>({
      controller: "device-manager/devices",
      action: "exportMeasures",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
    });

    const response = await axios.get(
      `http://localhost:7512/_/device-manager/engine-ayse/devices/DummyTemp-linked1/measures/_export/${result.exportId}`,
      {
        responseType: "stream",
      }
    );

    const csv = [];
    response.data.on("data", (chunk) => {
      csv.push(chunk.toString());
    });
    await new Promise((resolve) => {
      response.data.on("end", resolve);
    });

    expect(csv[0]).toBe(
      "_id,measuredAt,type,origin._id,origin.deviceModel,asset._id,asset.model,values.temperature,values.battery\n"
    );
    const [
      _id,
      measuredAt,
      type,
      originId,
      originDeviceModel,
      assetId,
      assetModel,
      temperature,
    ] = csv[1].split(",");
    expect(typeof _id).toBe("string");
    expect(typeof parseFloat(measuredAt)).toBe("number");
    expect(type).toBe("temperature");
    expect(originId).toBe("DummyTemp-linked1");
    expect(originDeviceModel).toBe("DummyTemp");
    expect(assetId).toBe("Container-linked1");
    expect(assetModel).toBe("Container");
    expect(parseFloat(temperature)).toBe(37);
  });
});
