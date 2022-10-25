import { JSONObject, PluginContext } from "kuzzle";

import { MeasureUnit } from "../../modules/measure";
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

  async registerAsset(
    model: string,
    metadataMappings: JSONObject,
    { engineGroup = "commons" }: { engineGroup?: string } = {}
  ) {
    this.assetModels.push({
      asset: { metadataMappings, model },
      engineGroup,
      type: "asset",
    });
  }

  async registerDevice(model: string, metadataMappings: JSONObject) {
    this.deviceModels.push({
      device: { metadataMappings, model },
      type: "device",
    });
  }

  async registerMeasure(
    name: string,
    unit: MeasureUnit,
    valuesMappings: JSONObject
  ) {
    this.measureModels.push({
      measure: { name, unit, valuesMappings },
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
