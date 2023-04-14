import _ from "lodash";
import { Backend, InternalError, Plugin } from "kuzzle";
import { JSONObject } from "kuzzle-sdk";
import { AbstractEngine, ConfigManager } from "kuzzle-plugin-commons";
import { EngineContent } from "kuzzle-plugin-commons/lib/engine/EngineContent";

import { assetsMappings, assetsHistoryMappings } from "../asset";
import {
  AssetModelContent,
  DeviceModelContent,
  MeasureModelContent,
} from "../model";
import { getEmbeddedMeasureMappings, measuresMappings } from "../measure";
import { devicesMappings } from "../device";
import { onAsk } from "../shared";
import { NamedMeasures } from "../decoder";

import { DeviceManagerConfiguration } from "./types/DeviceManagerConfiguration";
import { DeviceManagerPlugin } from "./DeviceManagerPlugin";
import { InternalCollection } from "./types/InternalCollection";

const digitalTwinMappings = {
  asset: assetsMappings,
  device: devicesMappings,
} as const;

export type AskEngineList = {
  name: "ask:device-manager:engine:list";

  payload: {
    group: string | null;
  };

  result: EngineContent[];
};

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

    onAsk<AskEngineList>("ask:device-manager:engine:list", async ({ group }) =>
      this.list(group)
    );

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

    const collections = await Promise.all(promises);

    return {
      collections: [this.engineConfigManager.collection, ...collections],
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

        mappings.properties.measures.properties[measureName] =
          getEmbeddedMeasureMappings(
            measureModel._source.measure.valuesMappings
          );
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
