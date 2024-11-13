import { EditorHintEnum } from "../../../../lib/modules/model";
import { setupHooks } from "../../../helpers";

jest.setTimeout(20000);

describe("ModelsController:assets", () => {
  const sdk = setupHooks();

  it("Write and List an Asset model", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Plane",
        metadataMappings: { company: { type: "keyword" } },
        metadataDetails: {
          company: {
            readOnly: true,
            type: EditorHintEnum.BASE,
          },
        },
        measures: [{ name: "temperatureExt", type: "temperature" }],
      },
    });

    const assetModel1 = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-Plane",
    );
    expect(assetModel1._source).toMatchObject({
      type: "asset",
      engineGroup: "commons",
      asset: {
        model: "Plane",
        metadataMappings: { company: { type: "keyword" } },
        metadataDetails: {
          company: {
            readOnly: true,
            type: EditorHintEnum.BASE,
          },
        },
        measures: [{ name: "temperatureExt", type: "temperature" }],
      },
    });

    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Plane",
        metadataMappings: {
          company: { type: "keyword" },
          company2: { type: "keyword" },
        },
        measures: [
          { name: "temperatureExt", type: "temperature" },
          { name: "position", type: "position" },
        ],
      },
    });

    const assetModel2 = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-Plane",
    );
    expect(assetModel2._source).toMatchObject({
      type: "asset",
      engineGroup: "commons",
      asset: {
        model: "Plane",
        metadataMappings: {
          company: { type: "keyword" },
          company2: { type: "keyword" },
        },
        measures: [
          { name: "temperatureExt", type: "temperature" },
          { name: "position", type: "position" },
        ],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const listAssets = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroup: "commons",
    });

    expect(listAssets.result.total).toBe(4);
    expect(listAssets.result.models).toMatchObject([
      { _id: "model-asset-Container" },
      { _id: "model-asset-MagicHouse" },
      { _id: "model-asset-Plane" },
      { _id: "model-asset-Warehouse" },
    ]);

    const getAsset = await sdk.query({
      controller: "device-manager/models",
      action: "getAsset",
      engineGroup: "commons",
      model: "Plane",
    });

    expect(getAsset.result).toMatchObject({
      _id: "model-asset-Plane",
      _source: { asset: { model: "Plane" } },
    });
  });

  it("List asset models only from the requested engine group and the common ones", async () => {
    const listAssets = await sdk.query({
      controller: "device-manager/models",
      action: "listAssets",
      engineGroup: "air_quality",
    });

    expect(listAssets.result.total).toBe(4);
    expect(listAssets.result.models).toMatchObject([
      { _id: "model-asset-Container" },
      { _id: "model-asset-MagicHouse" },
      { _id: "model-asset-Room" },
      { _id: "model-asset-Warehouse" },
    ]);
  });

  it("Write and Search an Asset model", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Plane",
        metadataMappings: { company: { type: "keyword" } },
        measures: [{ name: "temperatureExt", type: "temperature" }],
      },
    });

    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "Car",
        metadataMappings: {
          company: { type: "keyword" },
          company2: { type: "keyword" },
        },
        measures: [
          { name: "temperatureExt", type: "temperature" },
          { name: "position", type: "position" },
        ],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const searchAssets = await sdk.query({
      controller: "device-manager/models",
      action: "searchAssets",
      engineGroup: "commons",
      body: {
        query: {
          match: {
            "asset.model": "Plane",
          },
        },
      },
    });

    expect(searchAssets.result).toMatchObject({
      total: 1,
      hits: [{ _id: "model-asset-Plane" }],
    });
  });

  it("Search asset models only from the requested engine group and the common ones", async () => {
    let searchAssets = await sdk.query({
      controller: "device-manager/models",
      action: "searchAssets",
      engineGroup: "air_quality",
      body: {
        query: {
          match: {
            "asset.model": "Warehouse",
          },
        },
      },
    });

    expect(searchAssets.result).toMatchObject({
      total: 1,
      hits: [{ _id: "model-asset-Warehouse" }],
    });

    searchAssets = await sdk.query({
      controller: "device-manager/models",
      action: "searchAssets",
      engineGroup: "air_quality",
      body: {
        query: {
          match: {
            "asset.model": "Room",
          },
        },
      },
    });

    expect(searchAssets.result).toMatchObject({
      total: 1,
      hits: [{ _id: "model-asset-Room" }],
    });

    searchAssets = await sdk.query({
      controller: "device-manager/models",
      action: "searchAssets",
      engineGroup: "air_quality",
      body: {
        query: {
          match: {
            "asset.model": "StreetLamp",
          },
        },
      },
    });

    expect(searchAssets.result).toMatchObject({
      total: 0,
      hits: [],
    });
  });

  it("Error if the model name is not PascalCase", async () => {
    const badModelName = sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "plane",
        metadataMappings: { size: { type: "integer" } },
        defaultValues: { name: "Firebird" },
      },
    });

    await expect(badModelName).rejects.toMatchObject({
      message: 'Asset model "plane" must be PascalCase.',
    });
  });

  it("Register models from the framework", async () => {
    const containerModel = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-Container",
    );
    expect(containerModel._source).toMatchObject({
      type: "asset",
      engineGroup: "commons",
      asset: {
        model: "Container",
        metadataMappings: {
          weight: { type: "integer" },
          height: { type: "integer" },
        },
        measures: [
          { name: "temperatureExt", type: "temperature" },
          { name: "temperatureInt", type: "temperature" },
          { name: "position", type: "position" },
          { name: "temperatureWeather", type: "temperature" },
        ],
      },
    });

    const wareHouseModel = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-Warehouse",
    );
    expect(wareHouseModel._source).toMatchObject({
      type: "asset",
      engineGroup: "commons",
      asset: {
        model: "Warehouse",
        metadataMappings: { surface: { type: "integer" } },
        measures: [{ name: "position", type: "position" }],
      },
    });
  });

  it("Write and Retrieve an Asset model with tooltip models", async () => {
    const assetModelWithTooltip = {
      engineGroup: "commons",
      model: "AdvancedWarehouse",
      metadataMappings: {
        location: { type: "geo_point" },
        floor: { type: "integer" },
      },
      measures: [{ name: "temperatureInt", type: "temperature" }],
      tooltipModels: {
        "example-tooltip": {
          tooltipLabel: "Example Tooltip",
          content: [
            { category: "static", type: "title", value: "Warehouse Info" },
            { category: "metadata", metadataPath: "floor" },
          ],
        },
      },
    };

    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: assetModelWithTooltip,
    });

    const assetModel = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-AdvancedWarehouse",
    );
    expect(assetModel._source.asset).toHaveProperty("tooltipModels");
    delete assetModelWithTooltip.engineGroup;
    expect(assetModel._source).toMatchObject({
      type: "asset",
      engineGroup: "commons",
      asset: assetModelWithTooltip,
    });
  });

  it("Update the tooltip models of an Asset model", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAsset",
      body: {
        engineGroup: "commons",
        model: "AdvancedWarehouse",
        metadataMappings: {
          location: { type: "geo_point" },
          floor: { type: "integer" },
        },
        measures: [{ name: "temperatureInt", type: "temperature" }],
        tooltipModels: {
          "example-tooltip": {
            tooltipLabel: "Example Tooltip",
            content: [
              { category: "static", type: "title", value: "Warehouse Info" },
              { category: "metadata", metadataPath: "floor" },
            ],
          },
        },
      },
    });

    const updatedTooltipModels = {
      "example-tooltip": {
        tooltipLabel: "Updated Tooltip",
        content: [
          {
            category: "static",
            type: "title",
            value: "Updated Warehouse Info",
          },
          { category: "metadata", metadataPath: "location" },
        ],
      },
    };

    await sdk.query({
      controller: "device-manager/models",
      action: "updateAsset",
      _id: "model-asset-AdvancedWarehouse",
      engineGroup: "commons",
      model: "AdvancedWarehouse",
      body: {
        tooltipModels: updatedTooltipModels,
      },
    });

    const assetModel = await sdk.document.get(
      "device-manager",
      "models",
      "model-asset-AdvancedWarehouse",
    );
    expect(assetModel._source.asset).toHaveProperty("tooltipModels");
    expect(assetModel._source.asset.tooltipModels).toEqual(
      updatedTooltipModels,
    );
  });
});
