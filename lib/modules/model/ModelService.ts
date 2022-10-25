import { Backend, JSONObject, KDocument, PluginContext } from "kuzzle";

import {
  DeviceManagerConfiguration,
  DeviceManagerPlugin,
  InternalCollection,
} from "../../core";
import { MeasureUnit } from "../measure";
import {
  AssetModelContent,
  DeviceModelContent,
  MeasureModelContent,
} from "./types/ModelContent";
import { ModelSerializer } from "./ModelSerializer";

export class ModelService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  private get app(): Backend {
    return global.app;
  }

  constructor(plugin: DeviceManagerPlugin) {
    this.config = plugin.config as any;
    this.context = plugin.context;
  }

  async createAsset(
    model: string,
    metadataMappings: JSONObject,
    { engineGroup = "commons" }: { engineGroup?: string } = {}
  ): Promise<KDocument<AssetModelContent>> {
    const modelContent: AssetModelContent = {
      asset: { metadataMappings, model },
      engineGroup,
      type: "asset",
    };

    return this.sdk.document.create<AssetModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      modelContent,
      ModelSerializer.id<AssetModelContent>("asset", modelContent)
    );
  }

  async createDevice(
    model: string,
    metadataMappings: JSONObject
  ): Promise<KDocument<DeviceModelContent>> {
    const modelContent: DeviceModelContent = {
      device: { metadataMappings, model },
      type: "device",
    };

    return this.sdk.document.create<DeviceModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      modelContent,
      ModelSerializer.id<DeviceModelContent>("device", modelContent)
    );
  }

  async createMeasure(
    name: string,
    unit: MeasureUnit,
    valuesMappings: JSONObject
  ): Promise<KDocument<MeasureModelContent>> {
    const modelContent: MeasureModelContent = {
      measure: { name, unit, valuesMappings },
      type: "measure",
    };

    return this.sdk.document.create<MeasureModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      modelContent,
      ModelSerializer.id<MeasureModelContent>("measure", modelContent)
    );
  }
}
