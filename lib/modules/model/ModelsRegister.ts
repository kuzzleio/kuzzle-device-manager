import { Inflector, PluginContext, PluginImplementationError } from "kuzzle";

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
  MetadataDetails,
  MetadataGroups,
  MetadataMappings,
  ModelContent,
} from "./types/ModelContent";
import { ModelSerializer } from "./ModelSerializer";
import { JSONObject } from "kuzzle-sdk";

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
      InternalCollection.MODELS,
    );
  }

  /**
   * Registers an asset model.
   *
   * @param engineGroup - The engine group name.
   * @param model - The name of the asset model, which must be in PascalCase.
   * @param measures - The measures associated with this asset model.
   * @param metadataMappings - The metadata mappings for the model, defaults to an empty object.
   * @param defaultMetadata - The default metadata values for the model, defaults to an empty object.
   * @param metadataDetails - Optional detailed metadata descriptions and localizations.
   * @param metadataGroups - Optional groups for organizing metadata, with localizations.
   * @throws PluginImplementationError if the model name is not in PascalCase.
   */
  registerAsset(
    engineGroup: string,
    model: string,
    measures: NamedMeasures,
    metadataMappings: MetadataMappings = {},
    defaultMetadata: JSONObject = {},
    metadataDetails: MetadataDetails = {},
    metadataGroups: MetadataGroups = {},
  ) {
    if (Inflector.pascalCase(model) !== model) {
      throw new PluginImplementationError(
        `Asset model "${model}" must be PascalCase`,
      );
    }

    // Construct and push the new asset model to the assetModels array
    this.assetModels.push({
      asset: {
        defaultMetadata,
        measures,
        metadataDetails,
        metadataGroups,
        metadataMappings,
        model,
      },
      engineGroup,
      type: "asset",
    });
  }

  /**
   * Registers a device model.
   *
   * @param model - The name of the device model, which must be in PascalCase.
   * @param measures - The measures associated with this device model.
   * @param metadataMappings - The metadata mappings for the model, defaults to an empty object.
   * @param defaultMetadata - The default metadata values for the model, defaults to an empty object.
   * @param metadataDetails - Optional detailed metadata descriptions and localizations.
   * @param metadataGroups - Optional groups for organizing metadata, with localizations.
   * @throws PluginImplementationError if the model name is not in PascalCase.
   */
  registerDevice(
    model: string,
    measures: NamedMeasures,
    metadataMappings: MetadataMappings = {},
    defaultMetadata: JSONObject = {},
    metadataDetails: MetadataDetails = {},
    metadataGroups: MetadataGroups = {},
  ) {
    if (Inflector.pascalCase(model) !== model) {
      throw new PluginImplementationError(
        `Device model "${model}" must be PascalCase`,
      );
    }

    // Construct and push the new device model to the deviceModels array
    this.deviceModels.push({
      device: {
        defaultMetadata,
        measures,
        metadataDetails,
        metadataGroups,
        metadataMappings,
        model,
      },
      type: "device",
    });
  }

  registerMeasure(type: string, measureDefinition: MeasureDefinition) {
    this.measureModels.push({
      measure: {
        type,
        valuesDetails: measureDefinition.valuesDetails,
        valuesMappings: measureDefinition.valuesMappings,
      },
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
      ModelSerializer.title(type, model),
    );

    await this.sdk.document.mCreateOrReplace(
      this.config.adminIndex,
      InternalCollection.MODELS,
      documents as any,
      { strict: true },
    );

    this.context.log.info(
      `Successfully load "${type}" models: ${modelTitles.join(", ")}`,
    );
  }
}
