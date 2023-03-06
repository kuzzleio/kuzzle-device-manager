import {
  ApiAssetGetMeasuresRequest,
  ApiAssetGetMeasuresResult,
} from "../../../index";

import { sendDummyTempPayloads, setupHooks } from "../../helpers";

jest.setTimeout(10000);

describe("AssetsController:getMeasures", () => {
  const sdk = setupHooks();

  it("should returns measures linked to the asset", async () => {
    await sendDummyTempPayloads(sdk, [
      { deviceEUI: "unlinked1", temperature: 12 },
      { deviceEUI: "unlinked1", temperature: 14 },
      { deviceEUI: "linked1", temperature: 20 },
      { deviceEUI: "linked1", temperature: 22 },
      { deviceEUI: "linked1", temperature: 24 },
      { deviceEUI: "linked2", temperature: 42 },
      { deviceEUI: "linked2", temperature: 44 },
    ]);
    await sdk.collection.refresh("engine-ayse", "measures");

    {
      const { result } = await sdk.query<
        ApiAssetGetMeasuresRequest,
        ApiAssetGetMeasuresResult
      >({
        controller: "device-manager/assets",
        action: "getMeasures",
        engineId: "engine-ayse",
        _id: "Container-linked1",
      });

      expect(result.total).toBe(3);
      for (const measure of result.measures) {
        expect(measure._source.asset?._id).toBe("Container-linked1");
        expect(measure._source.type).toBe("temperature");
      }
    }

    {
      const { result } = await sdk.query<
        ApiAssetGetMeasuresRequest,
        ApiAssetGetMeasuresResult
      >({
        controller: "device-manager/assets",
        action: "getMeasures",
        engineId: "engine-ayse",
        _id: "Container-linked1",
        body: {
          sort: { "values.temperature": "desc" },
        },
      });

      expect(result.total).toBe(3);
      expect(result.measures[0]._source.values.temperature).toBe(24);
      expect(result.measures[1]._source.values.temperature).toBe(22);
      expect(result.measures[2]._source.values.temperature).toBe(20);
    }

    {
      const { result } = await sdk.query<
        ApiAssetGetMeasuresRequest,
        ApiAssetGetMeasuresResult
      >({
        controller: "device-manager/assets",
        action: "getMeasures",
        engineId: "engine-ayse",
        _id: "Container-linked1",
        body: {
          query: { equals: { "values.temperature": 22 } },
        },
      });

      expect(result.total).toBe(1);
      expect(result.measures[0]._source.values.temperature).toBe(22);
    }
  });
});
