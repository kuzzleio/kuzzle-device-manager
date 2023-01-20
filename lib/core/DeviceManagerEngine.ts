import _ from "lodash";
import { Backend, InternalError, JSONObject, Plugin } from "kuzzle";
import { AbstractEngine, ConfigManager } from "kuzzle-plugin-commons";

import { assetsMappings, assetsHistoryMappings } from "../modules/asset";
import {
  AssetModelContent,
  DeviceModelContent,
  MeasureModelContent,
} from "../modules/model";
import { measuresMappings } from "../modules/measure";
import { devicesMappings } from "../modules/device";
import { onAsk } from "../modules/shared";
import { NamedMeasures } from "../modules/decoder";

import { DeviceManagerConfiguration } from "./DeviceManagerConfiguration";
import { DeviceManagerPlugin } from "./DeviceManagerPlugin";
import { InternalCollection } from "./InternalCollection";

const digitalTwinMappings = {
  asset: assetsMappings,
  device: devicesMappings,
} as const;

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

    onAsk<AskEngineUpdateAll>(
      "ask:device-manager:engine:updateAll",
      async () => {
        await this.updateEngines();
        await this.createDevicesCollection(this.config.adminIndex);
      }
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
      { lang: "koncorde", size: 5000 }
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

    promises.push(this.createAssetsHistoryCollection(index, group));

    promises.push(this.createDevicesCollection(index));

    promises.push(this.createMeasuresCollection(index, group));

    promises.push(this.engineConfigManager.createCollection(index));

    await Promise.all(promises);

    return {
      collections: [
        InternalCollection.ASSETS,
        this.engineConfigManager.collection,
        InternalCollection.DEVICES,
        InternalCollection.MEASURES,
      ],
    };
  }

  async onUpdate(index: string, group = "commons") {
    const promises = [];

    promises.push(this.createAssetsCollection(index, group));

    promises.push(this.createAssetsHistoryCollection(index, group));

    promises.push(this.createDevicesCollection(index));

    promises.push(this.createMeasuresCollection(index, group));

    const collections = await Promise.all(promises);

    return { collections };
  }

  async onDelete(index: string) {
    const promises = [];

    promises.push(this.sdk.collection.delete(index, InternalCollection.ASSETS));
    promises.push(
      this.sdk.collection.delete(index, InternalCollection.ASSETS_HISTORY)
    );
    promises.push(
      this.sdk.collection.delete(index, InternalCollection.DEVICES)
    );
    promises.push(
      this.sdk.collection.delete(index, InternalCollection.MEASURES)
    );

    await Promise.all(promises);

    return {
      collections: [
        InternalCollection.ASSETS,
        InternalCollection.ASSETS_HISTORY,
        InternalCollection.DEVICES,
        InternalCollection.MEASURES,
      ],
    };
  }

  async createAssetsCollection(engineId: string, engineGroup: string) {
    const mappings = await this.getDigitalTwinMappings<AssetModelContent>(
      "asset",
      engineGroup
    );

    await this.sdk.collection.create(
      engineId,
      InternalCollection.ASSETS,
      mappings
    );

    return InternalCollection.ASSETS;
  }

  async createAssetsHistoryCollection(engineId: string, engineGroup: string) {
    const assetsCollectionMappings =
      await this.getDigitalTwinMappings<AssetModelContent>(
        "asset",
        engineGroup
      );

    const mappings = JSON.parse(JSON.stringify(assetsHistoryMappings));

    _.merge(mappings.properties.asset, assetsCollectionMappings);

    await this.sdk.collection.create(
      engineId,
      InternalCollection.ASSETS_HISTORY,
      mappings
    );

    return InternalCollection.ASSETS_HISTORY;
  }

  private async getDigitalTwinMappings<
    TDigitalTwinModelContent extends AssetModelContent | DeviceModelContent
  >(digitalTwinType: "asset" | "device", engineGroup?: string) {
    const models = await this.getModels<TDigitalTwinModelContent>(
      this.config.adminIndex,
      digitalTwinType,
      engineGroup
    );

    const measureModels = await this.getModels<MeasureModelContent>(
      this.config.adminIndex,
      "measure"
    );

    const mappings = JSON.parse(
      JSON.stringify(digitalTwinMappings[digitalTwinType])
    );

    for (const model of models) {
      _.merge(
        mappings.properties.metadata.properties,
        model._source[digitalTwinType].metadataMappings
      );

      for (const { name: measureName, type: measureType } of model._source[
        digitalTwinType
      ].measures as NamedMeasures) {
        const measureModel = measureModels.find(
          (m) => m._source.measure.type === measureType
        );

        if (!measureModel) {
          throw new InternalError(
            `Cannot find measure "${measureType}" declared in ${[
              digitalTwinType,
            ]} "${model._source[digitalTwinType].model}"`
          );
        }

        mappings.properties.measures.properties[measureName] = {
          properties: {
            measuredAt: { type: "date" },
            name: { type: "keyword" },
            payloadUuids: { type: "keyword" },
            type: { type: "keyword" },
            values: {
              properties: measureModel._source.measure.valuesMappings,
            },
          },
        };
      }
    }

    return mappings;
  }

  async createDevicesCollection(engineId: string) {
    const mappings = await this.getDigitalTwinMappings<DeviceModelContent>(
      "device"
    );

    await this.sdk.collection.create(
      engineId,
      InternalCollection.DEVICES,
      mappings
    );

    return InternalCollection.DEVICES;
  }

  async createMeasuresCollection(engineId: string, engineGroup: string) {
    const mappings = await this.getMeasuresMappings(engineGroup);

    await this.sdk.collection.create(
      engineId,
      InternalCollection.MEASURES,
      mappings
    );

    return InternalCollection.MEASURES;
  }

  private async getMeasuresMappings(engineGroup: string) {
    const models = await this.getModels<MeasureModelContent>(
      this.config.adminIndex,
      "measure"
    );

    const mappings = JSON.parse(JSON.stringify(measuresMappings));

    for (const model of models) {
      _.merge(
        mappings.properties.values.properties,
        model._source.measure.valuesMappings
      );
    }

    const _assetsMappings = await this.getDigitalTwinMappings(
      "asset",
      engineGroup
    );
    mappings.properties.asset.properties.metadata.properties =
      _assetsMappings.properties.metadata.properties;

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
      { lang: "koncorde", size: 5000 }
    );

    return result.hits;
  }
}
