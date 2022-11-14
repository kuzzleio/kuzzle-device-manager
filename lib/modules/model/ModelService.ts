import { BadRequestError, JSONObject, KDocument, PluginContext } from "kuzzle";

import {
  AskEngineUpdateAll,
  DeviceManagerConfiguration,
  DeviceManagerPlugin,
  InternalCollection,
} from "../../core";
import { ask, onAsk } from "../shared/utils/ask";

import {
  AssetModelContent,
  DeviceModelContent,
  MeasureModelContent,
} from "./types/ModelContent";
import { ModelSerializer } from "./ModelSerializer";
import { AskModelAssetGet, AskModelDeviceGet } from "./types/ModelEvents";
import { flattenObject } from "../shared/utils/flattenObject";

export class ModelService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  constructor(plugin: DeviceManagerPlugin) {
    this.config = plugin.config as any;
    this.context = plugin.context;

    this.registerAskEvents();
  }

  registerAskEvents() {
    onAsk<AskModelAssetGet>(
      "ask:device-manager:model:asset:get",
      ({ engineGroup, model }) => this.assetGet(engineGroup, model)
    );
    onAsk<AskModelDeviceGet>(
      "ask:device-manager:model:device:get",
      ({ model }) => this.deviceGet(model)
    );
  }

  async writeAsset(
    engineGroup: string,
    model: string,
    metadataMappings: JSONObject,
    defaultMetadata: JSONObject,
    measures: JSONObject
  ): Promise<KDocument<AssetModelContent>> {
    const modelContent: AssetModelContent = {
      asset: { defaultMetadata, measures, metadataMappings, model },
      engineGroup,
      type: "asset",
    };

    this.checkDefaultValues(metadataMappings, defaultMetadata);

    const assetModel = await this.sdk.document.upsert<AssetModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      ModelSerializer.id<AssetModelContent>("asset", modelContent),
      modelContent
    );

    await this.sdk.collection.refresh(
      this.config.adminIndex,
      InternalCollection.MODELS
    );
    await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");

    return assetModel;
  }

  private checkDefaultValues(
    metadataMappings: JSONObject,
    defaultMetadata: JSONObject
  ) {
    const metadata = Object.keys(
      JSON.parse(
        JSON.stringify(flattenObject(metadataMappings))
          .replace(/properties\./g, "")
          .replace(/\.type/g, "")
      )
    );

    const values = Object.keys(flattenObject(defaultMetadata));

    for (let i = 0; i < values.length; i++) {
      if (!metadata.includes(values[i])) {
        throw new BadRequestError(
          `The default value "${values[i]}" is not in the metadata mappings.`
        );
      }
    }
  }

  async writeDevice(
    model: string,
    metadataMappings: JSONObject,
    defaultMetadata: JSONObject,
    measures: JSONObject
  ): Promise<KDocument<DeviceModelContent>> {
    const modelContent: DeviceModelContent = {
      device: { defaultMetadata, measures, metadataMappings, model },
      type: "device",
    };

    const assetModel = await this.sdk.document.upsert<DeviceModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      ModelSerializer.id<DeviceModelContent>("device", modelContent),
      modelContent
    );

    await this.sdk.collection.refresh(
      this.config.adminIndex,
      InternalCollection.MODELS
    );
    await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");

    return assetModel;
  }

  async writeMeasure(
    type: string,
    valuesMappings: JSONObject
  ): Promise<KDocument<MeasureModelContent>> {
    const modelContent: MeasureModelContent = {
      measure: { type, valuesMappings },
      type: "measure",
    };

    const assetModel = await this.sdk.document.upsert<MeasureModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      ModelSerializer.id<MeasureModelContent>("measure", modelContent),
      modelContent
    );

    await this.sdk.collection.refresh(
      this.config.adminIndex,
      InternalCollection.MODELS
    );
    await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");

    return assetModel;
  }

  async deleteAsset(_id: string) {
    await this.sdk.document.delete(
      this.config.adminIndex,
      InternalCollection.MODELS,
      _id
    );
  }

  async deleteDevice(_id: string) {
    await this.sdk.document.delete(
      this.config.adminIndex,
      InternalCollection.MODELS,
      _id
    );
  }

  async deleteMeasure(_id: string) {
    await this.sdk.document.delete(
      this.config.adminIndex,
      InternalCollection.MODELS,
      _id
    );
  }

  async listAsset(
    engineGroup: string
  ): Promise<KDocument<AssetModelContent>[]> {
    const query = {
      and: [{ equals: { type: "asset" } }, { equals: { engineGroup } }],
    };
    const sort = { "asset.model": "asc" };

    const result = await this.sdk.document.search<AssetModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query, sort },
      { lang: "koncorde", size: 100 }
    );

    return result.hits;
  }

  async listDevices(): Promise<KDocument<DeviceModelContent>[]> {
    const query = {
      and: [{ equals: { type: "device" } }],
    };
    const sort = { "device.model": "asc" };

    const result = await this.sdk.document.search<DeviceModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query, sort },
      { lang: "koncorde", size: 100 }
    );

    return result.hits;
  }

  async listMeasures(): Promise<KDocument<MeasureModelContent>[]> {
    const query = {
      and: [{ equals: { type: "measure" } }],
    };
    const sort = { "measure.type": "asc" };

    const result = await this.sdk.document.search<MeasureModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query, sort },
      { lang: "koncorde", size: 100 }
    );

    return result.hits;
  }

  async assetExists(model: string): Promise<boolean> {
    const query = {
      and: [
        { equals: { type: "asset" } },
        { equals: { "asset.model": model } },
      ],
    };

    const result = await this.sdk.document.search(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 1 }
    );

    return result.total > 0;
  }

  async deviceExists(model: string): Promise<boolean> {
    const query = {
      and: [
        { equals: { type: "device" } },
        { equals: { "device.model": model } },
      ],
    };

    const result = await this.sdk.document.search(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 1 }
    );

    return result.total > 0;
  }

  private async assetGet(
    engineGroup: string,
    model: string
  ): Promise<AssetModelContent> {
    const query = {
      and: [
        { equals: { engineGroup } },
        { equals: { type: "asset" } },
        { equals: { "asset.model": model } },
      ],
    };

    const result = await this.sdk.document.search<AssetModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 1 }
    );

    if (result.total === 0) {
      throw new BadRequestError(`Unknown Asset model "${model}".`);
    }

    return result.hits[0]._source;
  }

  private async deviceGet(model: string): Promise<DeviceModelContent> {
    const query = {
      and: [
        { equals: { type: "device" } },
        { equals: { "device.model": model } },
      ],
    };

    const result = await this.sdk.document.search<DeviceModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 1 }
    );

    if (result.total === 0) {
      throw new BadRequestError(`Unknown Device model "${model}".`);
    }

    return result.hits[0]._source;
  }
}
