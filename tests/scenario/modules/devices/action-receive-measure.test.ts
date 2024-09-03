import {
  ApiDeviceReceiveMeasuresRequest,
  ApiDeviceReceiveMeasuresResult,
  TemperatureMeasurement,
} from "../../../../index";

import { setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("DeviceController: receiveMeasure", () => {
  const sdk = setupHooks();

  it("should receive a formated measure and process it in the ingestion pipeline", async () => {
    await sdk.query<
      ApiDeviceReceiveMeasuresRequest<TemperatureMeasurement>,
      ApiDeviceReceiveMeasuresResult
    >({
      controller: "device-manager/devices",
      action: "receiveMeasures",
      engineId: "engine-ayse",
      _id: "DummyTemp-linked1",
      body: {
        payloadUuids: ["foobar-barfoo"],
        measures: [
          {
            measuredAt: 1674906229441,
            measureName: "temperature",
            type: "temperature",
            values: {
              temperature: 25.5,
            },
          },
        ],
      },
    });

    await Promise.all([
      sdk.collection.refresh("engine-ayse", "measures"),
      sdk.collection.refresh("device-manager", "payloads"),
    ]);

    const measures = await sdk.document.search(
      "engine-ayse",
      "measures",
      {
        query: {
          equals: { measuredAt: 1674906229441 },
        },
      },
      { lang: "koncorde", limit: 1 },
    );

    expect(measures.hits).toHaveLength(1);

    expect(measures.hits[0]._source).toMatchObject({
      origin: {
        _id: "DummyTemp-linked1",
        payloadUuids: ["foobar-barfoo"],
      },
      asset: {
        _id: "Container-linked1",
      },
      measuredAt: 1674906229441,
      type: "temperature",
      values: {
        temperature: 25.5,
      },
    });

    const payloads = await sdk.document.search(
      "device-manager",
      "payloads",
      {
        query: {
          equals: { uuid: "foobar-barfoo" },
        },
      },
      { lang: "koncorde", limit: 1 },
    );

    expect(payloads.hits).toHaveLength(1);
    expect(payloads.hits[0]._source).toMatchObject({
      deviceModel: "DummyTemp",
      apiAction: "device-manager/devices:receiveMeasure",
      payload: [
        {
          measuredAt: 1674906229441,
          measureName: "temperature",
          type: "temperature",
          values: {
            temperature: 25.5,
          },
        },
      ],
    });

    await expect(
      sdk.query({
        _id: "DummyTemp-linked1",
        action: "getLastMeasures",
        controller: "device-manager/devices",
        engineId: "engine-ayse",
      }),
    ).resolves.toMatchObject({
      result: {
        temperature: {
          originId: "DummyTemp-linked1",
          values: {
            temperature: 25.5,
          },
        },
      },
    });
  });

  it("should raise an error when receiving a undeclared measure", async () => {
    await expect(
      sdk.query<
        ApiDeviceReceiveMeasuresRequest,
        ApiDeviceReceiveMeasuresResult
      >({
        controller: "device-manager/devices",
        action: "receiveMeasures",
        engineId: "engine-ayse",
        _id: "DummyTemp-linked1",
        body: {
          measures: [
            {
              measuredAt: 1674906229441,
              measureName: "temperatureInternal",
              type: "temperature",
              values: {
                temperature: 25.5,
              },
            },
          ],
        },
      }),
    ).rejects.toThrow(
      'Measure "temperatureInternal" is not declared for this device model.',
    );
  });
});
