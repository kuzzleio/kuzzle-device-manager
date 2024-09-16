import { EditorHintEnum } from "lib/modules/model";
import { setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("ModelsController:devices", () => {
  const sdk = setupHooks();

  it("Write and List a Device model", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "Zigbee",
        measures: [{ type: "battery", name: "battery" }],
        metadataMappings: { network: { type: "keyword" } },
      },
    });

    const deviceModel1 = await sdk.document.get(
      "device-manager",
      "models",
      "model-device-Zigbee",
    );
    expect(deviceModel1._source).toMatchObject({
      type: "device",
      device: {
        model: "Zigbee",
        metadataMappings: { network: { type: "keyword" } },
      },
    });

    await sdk.query({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "Zigbee",
        measures: [
          { type: "battery", name: "battery" },
          { type: "temperature", name: "temperature" },
        ],
        metadataMappings: {
          network: { type: "keyword" },
          network2: { type: "keyword" },
        },
      },
    });

    const deviceModel2 = await sdk.document.get(
      "device-manager",
      "models",
      "model-device-Zigbee",
    );
    expect(deviceModel2._source).toMatchObject({
      type: "device",
      device: {
        model: "Zigbee",
        metadataMappings: {
          network: { type: "keyword" },
          network2: { type: "keyword" },
        },
        measures: [
          { type: "battery", name: "battery" },
          { type: "temperature", name: "temperature" },
        ],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const tenantDeviceMapping = await sdk.collection.getMapping(
      "engine-ayse",
      "devices",
    );
    expect(tenantDeviceMapping.properties).toMatchObject({
      metadata: {
        properties: {
          color: { type: "keyword" },
          network: { type: "keyword" },
          network2: { type: "keyword" },
        },
      },
    });

    const platformDevicesMapping = await sdk.collection.getMapping(
      "device-manager",
      "devices",
    );
    expect(platformDevicesMapping.properties).toMatchObject({
      metadata: {
        properties: {
          color: { type: "keyword" },
          network: { type: "keyword" },
          network2: { type: "keyword" },
        },
      },
    });

    const listDevices = await sdk.query({
      controller: "device-manager/models",
      action: "listDevices",
    });

    expect(listDevices.result).toMatchObject({
      total: 3,
      models: [
        { _id: "model-device-DummyTemp" },
        { _id: "model-device-DummyTempPosition" },
        { _id: "model-device-Zigbee" },
      ],
    });

    const getDevice = await sdk.query({
      controller: "device-manager/models",
      action: "getDevice",
      model: "Zigbee",
    });

    expect(getDevice.result).toMatchObject({
      _id: "model-device-Zigbee",
      _source: { device: { model: "Zigbee" } },
    });
  });

  it("Write and Search a Device model", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "Zigbee",
        measures: [{ type: "battery", name: "battery" }],
        metadataMappings: { network: { type: "keyword" } },
      },
    });

    await sdk.query({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "Bluetooth",
        measures: [
          { type: "battery", name: "battery" },
          { type: "temperature", name: "temperature" },
        ],
        metadataMappings: {
          network: { type: "keyword" },
          network2: { type: "keyword" },
        },
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const searchDevices = await sdk.query({
      controller: "device-manager/models",
      action: "searchDevices",
      body: {
        query: {
          match: {
            "device.model": "Zigbee",
          },
        },
      },
    });

    expect(searchDevices.result).toMatchObject({
      total: 1,
      hits: [{ _id: "model-device-Zigbee" }],
    });
  });

  it("Error if the model name is not PascalCase", async () => {
    const badModelName = sdk.query({
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        engineGroup: "commons",
        model: "plane",
        metadataMappings: { size: { type: "integer" } },
        metadataDetails: { readOnly: true, type: EditorHintEnum.BASE },
        defaultValues: { name: "Firebird" },
        measures: [{ type: "temperature", name: "temperature" }],
      },
    });

    await expect(badModelName).rejects.toMatchObject({
      message: 'Device model "plane" must be PascalCase.',
    });
  });

  it("Register models from the framework", async () => {
    const dummyTempPositionModel = await sdk.document.get(
      "device-manager",
      "models",
      "model-device-DummyTempPosition",
    );
    expect(dummyTempPositionModel._source).toMatchObject({
      type: "device",
      device: {
        model: "DummyTempPosition",
        metadataMappings: { serial: { type: "keyword" } },
        measures: [
          { name: "temperature", type: "temperature" },
          { name: "battery", type: "battery" },
          { name: "position", type: "position" },
        ],
      },
    });

    const dummyTempModel = await sdk.document.get(
      "device-manager",
      "models",
      "model-device-DummyTemp",
    );
    expect(dummyTempModel._source).toMatchObject({
      type: "device",
      device: {
        model: "DummyTemp",
        metadataMappings: { color: { type: "keyword" } },
        measures: [
          { name: "temperature", type: "temperature" },
          { name: "accelerationSensor", type: "acceleration" },
          { name: "battery", type: "battery" },
        ],
      },
    });
  });
});
