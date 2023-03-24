import { Inflector, PluginContext, PluginImplementationError } from "kuzzle";
import { JSONObject } from "kuzzle-sdk";

import {
  DeviceManagerConfiguration,
  DeviceManagerPlugin,
  InternalCollection,
} from "../plugin";
import { NamedMeasures } from "../decoder";
import { MeasureDefinition } from "../measure";

import {
  AssetModelContent,
  DeviceModelContent,
  MeasureModelContent,
  ModelContent,
} from "./types/ModelContent";
import { ModelSerializer } from "./ModelSerializer";

export class ModelsRegister {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private assetModels: AssetModelContent[] = [];
  private deviceModels: DeviceModelContent[] = [];
  private measureModels: MeasureModelContent[] = [];

  private get sdk() {
    return this.context.accessors.sdk;
  }

  init(plugin: DeviceManagerPlugin) {
    this.config = plugin.config as any;
    this.context = plugin.context;
  }

  async loadModels() {
    await Promise.all([
      this.load("asset", this.assetModels),
      this.load("device", this.deviceModels),
      this.load("measure", this.measureModels),
    ]);

    await this.sdk.collection.refresh(
      this.config.adminIndex,
      InternalCollection.MODELS
    );
  }

  registerAsset(
    engineGroup: string,
    model: string,
    measures: NamedMeasures,
    metadataMappings: JSONObject = {},
    defaultMetadata: JSONObject = {}
  ) {
    if (Inflector.pascalCase(model) !== model) {
      throw new PluginImplementationError(
        `Asset model "${model}" must be PascalCase`
      );
    }

    this.assetModels.push({
      asset: { defaultMetadata, measures, metadataMappings, model },
      engineGroup,
      type: "asset",
    });
  }

  registerDevice(
    model: string,
    measures: NamedMeasures,
    metadataMappings: JSONObject = {},
    defaultMetadata: JSONObject = {}
  ) {
    if (Inflector.pascalCase(model) !== model) {
      throw new PluginImplementationError(
        `Device model "${model}" must be PascalCase`
      );
    }

    this.deviceModels.push({
      device: { defaultMetadata, measures, metadataMappings, model },
      type: "device",
    });
  }

  registerMeasure(type: string, measureDefinition: MeasureDefinition) {
    this.measureModels.push({
      measure: { type, valuesMappings: measureDefinition.valuesMappings },
      type: "measure",
    });
  }

  private async load(type: string, models: ModelContent[]) {
    const documents = models.map((model) => {
      return {
        _id: ModelSerializer.id(type, model),
        body: model,
      };
    });

    const modelTitles = models.map((model) =>
      ModelSerializer.title(type, model)
    );

    await this.sdk.document.mCreateOrReplace(
      this.config.adminIndex,
      InternalCollection.MODELS,
      documents as any,
      { strict: true }
    );

    this.context.log.info(
      `Successfully load "${type}" models: ${modelTitles.join(", ")}`
    );
  }
}
