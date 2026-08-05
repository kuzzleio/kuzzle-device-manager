import { Inflector, PluginContext, PluginImplementationError } from "kuzzle";
import { ask } from "kuzzle-plugin-commons";

import {
  AskEngineList,
  DeviceManagerConfiguration,
  DeviceManagerPlugin,
  InternalCollection,
} from "../plugin";
import { NamedMeasures } from "../decoder";
import { MeasureDefinition } from "../measure";

import {
  AssetModelContent,
  DeviceModelContent,
  GroupAffinity,
  GroupModelContent,
  LocaleDetails,
  MeasureModelContent,
  MetadataDetails,
  MetadataGroups,
  MetadataMappings,
  ModelContent,
  TooltipModels,
} from "./types/ModelContent";
import { MeasureAdapterContent } from "./types/MeasureAdapterContent";
import { ModelSerializer } from "./ModelSerializer";
import { MeasureAdapterSerializer } from "./MeasureAdapterSerializer";
import { JSONObject } from "kuzzle-sdk";
import { addSchemaToCache, getAJVErrors } from "../shared/utils/AJValidator";
import { SchemaValidationError } from "../shared/errors/SchemaValidationError";
import { getNamedMeasuresDuplicates } from "./MeasuresDuplicates";
import { MeasuresNamesDuplicatesError } from "./MeasuresNamesDuplicatesError";
import { KuzzleLogger } from "kuzzle-logger";

interface RegisteredMeasureAdapter {
  content: MeasureAdapterContent;
  engineIds?: string[];
}

export class ModelsRegister {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private assetModels: AssetModelContent[] = [];
  private deviceModels: DeviceModelContent[] = [];
  private groupModels: GroupModelContent[] = [];
  private measureModels: MeasureModelContent[] = [];
  private measureAdapters: RegisteredMeasureAdapter[] = [];
  private logger: KuzzleLogger;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  init(plugin: DeviceManagerPlugin) {
    this.config = plugin.config as any;
    this.context = plugin.context;
    this.logger = this.context.logger.child("models-module:register");
  }

  async loadModels() {
    await Promise.all([
      this.load("asset", this.assetModels),
      this.load("device", this.deviceModels),
      this.load("group", this.groupModels),
      this.load("measure", this.measureModels),
    ]);

    await this.sdk.collection.refresh(
      this.config.platformIndex,
      InternalCollection.MODELS,
    );
  }

  /**
   * Registers an asset model.
   *
   * @param engineGroups - The engine group names.
   * @param model - The name of the asset model, which must be in PascalCase.
   * @param measures - The measures associated with this asset model.
   * @param metadataMappings - The metadata mappings for the model, defaults to an empty object.
   * @param defaultMetadata - The default metadata values for the model, defaults to an empty object.
   * @param metadataDetails - Optional detailed metadata descriptions, localizations and definition.
   * @param metadataGroups - Optional groups for organizing metadata, with localizations.
   * @param tooltipModels - Optional model list for tooltip, containing labels and tooltip content.
   * @param icon - Optional icon representing the model.
   * @throws PluginImplementationError if the model name is not in PascalCase.
   */
  registerAsset(
    engineGroups: string[],
    model: string,
    measures: NamedMeasures,
    metadataMappings: MetadataMappings = {},
    defaultMetadata: JSONObject = {},
    metadataDetails: MetadataDetails = {},
    metadataGroups: MetadataGroups = {},
    tooltipModels: TooltipModels = {},
    locales: { [valueName: string]: LocaleDetails } = {},
    icon?: string,
  ) {
    if (Inflector.pascalCase(model) !== model) {
      throw new PluginImplementationError(
        `Asset model "${model}" must be PascalCase`,
      );
    }

    const duplicates = getNamedMeasuresDuplicates(measures);

    if (duplicates.length > 0) {
      throw new MeasuresNamesDuplicatesError(
        "Asset model measures contain one or multiple duplicate measure name",
        duplicates,
      );
    }

    // Construct and push the new asset model to the assetModels array
    this.assetModels.push({
      asset: {
        defaultMetadata,
        icon,
        locales,
        measures,
        metadataDetails,
        metadataGroups,
        metadataMappings,
        model,
        tooltipModels,
      },
      engineGroups,
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
   * @param metadataDetails - Optional detailed metadata descriptions, localizations and definition.
   * @param metadataGroups - Optional groups for organizing metadata, with localizations.
   * @param icon - Optional icon representing the model.
   * @throws PluginImplementationError if the model name is not in PascalCase.
   */
  registerDevice(
    model: string,
    measures: NamedMeasures,
    metadataMappings: MetadataMappings = {},
    defaultMetadata: JSONObject = {},
    metadataDetails: MetadataDetails = {},
    metadataGroups: MetadataGroups = {},
    icon?: string,
  ) {
    if (Inflector.pascalCase(model) !== model) {
      throw new PluginImplementationError(
        `Device model "${model}" must be PascalCase`,
      );
    }

    const duplicates = getNamedMeasuresDuplicates(measures);

    if (duplicates.length > 0) {
      throw new MeasuresNamesDuplicatesError(
        "Device model measures contain one or multiple duplicate measure name",
        duplicates,
      );
    }

    // Construct and push the new device model to the deviceModels array
    this.deviceModels.push({
      device: {
        defaultMetadata,
        icon,
        measures,
        metadataDetails,
        metadataGroups,
        metadataMappings,
        model,
      },
      type: "device",
    });
  }

  /**
   * Registers a group model.
   *
   *
   * @param engineGroups - The engine group names.
   * @param model - The name of the group model, which must be in PascalCase.
   * @param affinity - The type of object accepted and their model affinity.
   * @param metadataMappings - The metadata mappings for the model, defaults to an empty object.
   * @param defaultMetadata - The default metadata values for the model, defaults to an empty object.
   * @param metadataDetails - Optional detailed metadata descriptions, localizations and definition.
   * @param metadataGroups - Optional groups for organizing metadata, with localizations.
   * @param icon - Optional icon representing the model.
   * @throws PluginImplementationError if the model name is not in PascalCase.
   */
  registerGroup(
    engineGroups: string[],
    model: string,
    affinity: GroupAffinity,
    metadataMappings: MetadataMappings = {},
    defaultMetadata: JSONObject = {},
    metadataDetails: MetadataDetails = {},
    metadataGroups: MetadataGroups = {},
    icon?: string,
  ) {
    if (Inflector.pascalCase(model) !== model) {
      throw new PluginImplementationError(
        `Group model "${model}" must be PascalCase`,
      );
    }

    // Construct and push the new group model to the groupModels array
    this.groupModels.push({
      engineGroups,
      group: {
        affinity,
        defaultMetadata,
        icon,
        metadataDetails,
        metadataGroups,
        metadataMappings,
        model,
      },
      type: "group",
    });
  }

  registerMeasure(type: string, measureDefinition: MeasureDefinition) {
    const {
      icon,
      locales,
      validationSchema,
      valuesMappings,
      valuesDetails,
      scope,
    } = measureDefinition;
    if (validationSchema) {
      try {
        addSchemaToCache(type, validationSchema);
      } catch (error) {
        throw new SchemaValidationError(
          "Provided schema is not valid",
          getAJVErrors(),
        );
      }
    }

    this.measureModels.push({
      measure: {
        icon,
        locales,
        scope: scope ?? "asset",
        type,
        validationSchema,
        valuesDetails,
        valuesMappings,
      },
      type: "measure",
    });
  }

  registerMeasureAdapter(
    name: string,
    measureModelSource: string,
    fieldMapping: MeasureAdapterContent["fieldMapping"],
    engineIds?: string[],
  ) {
    if (!name || !measureModelSource) {
      throw new PluginImplementationError(
        `Measure adapter registration is missing required field "${
          name ? "measureModelSource" : "name"
        }"`,
      );
    }

    if (!fieldMapping?.length) {
      throw new PluginImplementationError(
        `Measure adapter "${name}" registration must declare at least one "fieldMapping" entry`,
      );
    }

    const targetsByModel = new Map<string, Set<string>>();
    for (const mapping of fieldMapping) {
      for (const [key, value] of Object.entries(mapping)) {
        if (!value) {
          throw new PluginImplementationError(
            `Measure adapter "${name}" has a "fieldMapping" entry missing required field "${key}"`,
          );
        }
      }

      const targets =
        targetsByModel.get(mapping.measureModelTarget) ?? new Set();
      if (targets.has(mapping.target)) {
        throw new PluginImplementationError(
          `Measure adapter "${name}" has two "fieldMapping" entries targeting the same field "${mapping.target}" on measure model "${mapping.measureModelTarget}"`,
        );
      }
      targets.add(mapping.target);
      targetsByModel.set(mapping.measureModelTarget, targets);
    }

    this.measureAdapters.push({
      content: {
        fieldMapping,
        measureModelSource,
        name,
      },
      engineIds,
    });
  }

  getMeasureAdaptersForEngine(engineId: string): MeasureAdapterContent[] {
    return this.measureAdapters
      .filter(
        ({ engineIds }) => !engineIds?.length || engineIds.includes(engineId),
      )
      .map(({ content }) => content);
  }

  async writeMeasureAdaptersToEngine(engineId: string) {
    const adapters = this.getMeasureAdaptersForEngine(engineId);

    if (adapters.length === 0) {
      return;
    }

    await this.sdk.document.mCreateOrReplace(
      engineId,
      InternalCollection.CONFIG,
      adapters.map((content) => ({
        _id: MeasureAdapterSerializer.id(content.name),
        body: MeasureAdapterSerializer.document(content),
      })),
      { strict: true },
    );

    this.logger.info(
      `[DeviceAdapter] Successfully propagated measure adapters to engine "${engineId}": ${adapters
        .map((content) => content.name)
        .join(", ")}`,
    );
  }

  async propagateMeasureAdapters() {
    if (this.measureAdapters.length === 0) {
      return;
    }

    const engines = await ask<AskEngineList>(
      "ask:device-manager:engine:list",
      {},
    );

    await Promise.all(
      engines.map((engine) => this.writeMeasureAdaptersToEngine(engine.index)),
    );
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
      this.config.platformIndex,
      InternalCollection.MODELS,
      documents as any,
      { strict: true },
    );

    this.logger.info(
      `Successfully load "${type}" models: ${modelTitles.join(", ")}`,
    );
  }
}
