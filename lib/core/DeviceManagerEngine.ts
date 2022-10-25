import _ from "lodash";
import { JSONObject, Plugin } from "kuzzle";
import { AbstractEngine, ConfigManager } from "kuzzle-plugin-commons";

import { assetsMappings } from "../modules/asset";
import {
  AssetModelContent,
  DeviceModelContent,
  MeasureModelContent,
} from "../modules/model";
import { measuresMappings } from "../modules/measure";
import { devicesMappings } from "../modules/device";

import { DeviceManagerConfiguration } from "./DeviceManagerConfiguration";
import { DeviceManagerPlugin } from "./DeviceManagerPlugin";
import { InternalCollection } from "./InternalCollection";

export class DeviceManagerEngine extends AbstractEngine<DeviceManagerPlugin> {
  public config: DeviceManagerConfiguration;

  constructor(
    plugin: Plugin,
    adminConfigManager: ConfigManager,
    engineConfigManager: ConfigManager
  ) {
    super(
      "device-manager",
      plugin,
      plugin.config.adminIndex,
      adminConfigManager,
      engineConfigManager
    );

    this.context = plugin.context;
  }

  async onCreate(index: string, group = "commons") {
    const promises = [];

    promises.push(this.createAssetsCollection(index, group));

    promises.push(this.createDevicesCollection(index));

    promises.push(this.createMeasuresCollection(index));

    promises.push(this.engineConfigManager.createCollection(index));

    await Promise.all(promises);

    return {
      collections: [
        "assets",
        this.engineConfigManager.collection,
        "devices",
        "measures",
      ],
    };
  }

  async onUpdate(index: string, group = "commons") {
    const promises = [];

    promises.push(this.createAssetsCollection(index, group));

    promises.push(this.createDevicesCollection(index));

    promises.push(this.createMeasuresCollection(index));

    const collections = await Promise.all(promises);

    return { collections };
  }

  async onDelete(index: string) {
    const promises = [];

    promises.push(this.sdk.collection.delete(index, "assets"));
    promises.push(this.sdk.collection.delete(index, "devices"));
    promises.push(this.sdk.collection.delete(index, "measures"));

    await Promise.all(promises);

    return { collections: ["assets", "devices", "measures"] };
  }

  async createAssetsCollection(engineId: string, engineGroup = "commons") {
    const models = await this.getModels<AssetModelContent>(
      this.config.adminIndex,
      "asset",
      engineGroup
    );

    const mappings = JSON.parse(JSON.stringify(assetsMappings));

    for (const model of models) {
      mappings.properties.metadata.properties = _.merge(
        mappings.properties.metadata.properties,
        model._source.asset.metadataMappings
      );
    }

    mappings.properties.measures = await this.getMeasuresMappings();

    await this.sdk.collection.create(
      engineId,
      InternalCollection.ASSETS,
      mappings
    );

    return InternalCollection.ASSETS;
  }

  async createDevicesCollection(engineId: string) {
    const models = await this.getModels<DeviceModelContent>(
      this.config.adminIndex,
      "device"
    );

    const mappings = JSON.parse(JSON.stringify(devicesMappings));

    for (const model of models) {
      mappings.properties.metadata.properties = _.merge(
        mappings.properties.metadata.properties,
        model._source.device.metadataMappings
      );
    }

    mappings.properties.measures = await this.getMeasuresMappings();

    await this.sdk.collection.create(
      engineId,
      InternalCollection.DEVICES,
      mappings
    );

    return InternalCollection.DEVICES;
  }

  async createMeasuresCollection(engineId: string) {
    const mappings = await this.getMeasuresMappings();

    await this.sdk.collection.create(
      engineId,
      InternalCollection.MEASURES,
      mappings
    );

    return InternalCollection.MEASURES;
  }

  private async getMeasuresMappings() {
    const models = await this.getModels<MeasureModelContent>(
      this.config.adminIndex,
      "measure"
    );

    const mappings = JSON.parse(JSON.stringify(measuresMappings));

    for (const model of models) {
      mappings.properties.values.properties = _.merge(
        mappings.properties.values.properties,
        model._source.measure.valuesMappings
      );
    }

    return mappings;
  }

  private async getModels<T>(
    engineId: string,
    type: string,
    engineGroup?: string
  ) {
    const query: JSONObject = {
      and: [{ equals: { type } }],
    };

    if (engineGroup) {
      query.and.push({
        or: [
          { equals: { engineGroup } },
          { equals: { engineGroup: "commons" } },
        ],
      });
    }

    const result = await this.sdk.document.search<T>(
      engineId,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 100 }
    );

    return result.hits;
  }
}
