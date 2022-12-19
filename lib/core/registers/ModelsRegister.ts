import { JSONObject, PluginContext } from "kuzzle";
import { MeasureDefinition } from "lib/modules/measure";

import { ModelSerializer } from "../../modules/model";
import {
  AssetModelContent,
  MeasureModelContent,
  ModelContent,
  DeviceModelContent,
} from "../../modules/model";
import { DeviceManagerConfiguration } from "../DeviceManagerConfiguration";
import { DeviceManagerPlugin } from "../DeviceManagerPlugin";
import { InternalCollection } from "../InternalCollection";

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
    metadataMappings: JSONObject,
    measures: Record<string, string>,
    defaultMetadata: JSONObject = {}
  ) {
    this.assetModels.push({
      asset: { defaultMetadata, measures, metadataMappings, model },
      engineGroup,
      type: "asset",
    });
  }

  registerDevice(
    model: string,
    measures: Record<string, string>,
    metadataMappings: JSONObject = {},
    defaultMetadata: JSONObject = {}
  ) {
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
