import _ from "lodash";
import { Backend, InternalError, JSONObject, NotFoundError, Plugin } from "kuzzle";
import { AbstractEngine, ConfigManager } from "kuzzle-plugin-commons";

import { assetsMappings } from "../modules/asset";
import {
  AssetModelContent,
  DeviceModelContent,
  MeasureModelContent,
} from "../modules/model";
import { measuresMappings } from "../modules/measure";
import { devicesMappings } from "../modules/device";
import { onAsk } from "../modules/shared/utils/ask";

import { DeviceManagerConfiguration } from "./DeviceManagerConfiguration";
import { DeviceManagerPlugin } from "./DeviceManagerPlugin";
import { InternalCollection } from "./InternalCollection";

export type AskEngineUpdateAll = {
  name: "ask:device-manager:engine:updateAll";

  payload: void;

  result: void;
};

export class DeviceManagerEngine extends AbstractEngine<DeviceManagerPlugin> {
  public config: DeviceManagerConfiguration;

  get app(): Backend {
    return global.app;
  }

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

    onAsk<AskEngineUpdateAll>("ask:device-manager:engine:updateAll", () =>
      this.updateEngines()
    );
  }

  async updateEngines() {
    const result = await this.sdk.document.search(
      this.config.adminIndex,
      InternalCollection.CONFIG,
      {
        query: {
          equals: { type: "engine-device-manager" },
        },
      },
      { lang: "koncorde", size: 1000 }
    );

    this.context.log.info(`Update ${result.fetched} existing engines`);

    for (const engine of result.hits) {
      await this.onUpdate(
        engine._source.engine.index,
        engine._source.engine.group
      );
    }
  }

  async onCreate(index: string, group = "commons") {
    const promises = [];

    promises.push(this.createAssetsCollection(index, group));

    promises.push(this.createDevicesCollection(index));

    promises.push(this.createMeasuresCollection(index, group));

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

    promises.push(this.createMeasuresCollection(index, group));

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

  async createAssetsCollection(engineId: string, engineGroup: string) {
    const mappings = await this.getAssetsMappings(engineGroup);


    await this.sdk.collection.create(
      engineId,
      InternalCollection.ASSETS,
      mappings
    );

    return InternalCollection.ASSETS;
  }

  private async getAssetsMappings(engineGroup: string) {
    const models = await this.getModels<AssetModelContent>(
      this.config.adminIndex,
      "asset",
      engineGroup
    );

    const measureModels = await this.getModels<MeasureModelContent>(
      this.config.adminIndex,
      "measure"
    );

    const mappings = JSON.parse(JSON.stringify(assetsMappings));

    for (const model of models) {
      mappings.properties.metadata.properties = _.merge(
        mappings.properties.metadata.properties,
        model._source.asset.metadataMappings
      );

      for (const [measureName, measureType] of Object.entries(model._source.asset.measures)) {
        const measureModel = measureModels.find(
          (model) => model._source.measure.type === measureType
        );

        if (!measureModel) {
          throw new InternalError(
            `Cannot find measure "${measureType}" declared in asset "${model._source.asset.model}"`
          );
        }

        mappings.properties.measures.properties[measureName] = {
          properties: {
            type: { type: "keyword" },
            payloadUuids: { type: "keyword" },
            measuredAt: { type: "date" },
            values: {
              properties: measureModel._source.measure.valuesMappings
            }
          }
        };
      }
    }

    return mappings;
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

    mappings.properties.measures = await this.getMeasuresMappings({
      withAssetDescription: false,
    });

    await this.sdk.collection.create(
      engineId,
      InternalCollection.DEVICES,
      mappings
    );

    return InternalCollection.DEVICES;
  }

  async createMeasuresCollection(engineId: string, engineGroup: string) {
    const mappings = await this.getMeasuresMappings({
      engineGroup,
      withAssetDescription: true,
    });

    await this.sdk.collection.create(
      engineId,
      InternalCollection.MEASURES,
      mappings
    );

    return InternalCollection.MEASURES;
  }

  /**
   * engineGroup should be specified if the measures needs to be contextualized
   * with the asset description.
   * It's not used when adding the measures mappings inside the devices or assets collections
   */
  private async getMeasuresMappings({
    engineGroup,
    withAssetDescription,
  }: {
    engineGroup?: string;
    withAssetDescription: boolean;
  }) {
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

    if (withAssetDescription) {
      // assetsMappings is already declared
      const _assetsMappings = await this.getAssetsMappings(engineGroup);
      mappings.properties.asset.properties.metadata.properties =
        _assetsMappings.properties.metadata.properties;
    } else {
      mappings.properties.asset = undefined;
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
