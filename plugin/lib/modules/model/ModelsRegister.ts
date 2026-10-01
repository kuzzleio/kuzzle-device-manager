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
  GroupAffinity,
  GroupModelContent,
  LocaleDetails,
  MeasureModelContent,
  MetadataDetails,
  MetadataGroups,
  MetadataMappings,
  MetadataReferential,
  MetadataReferentialEntry,
  MetadataReferences,
  ModelContent,
  TooltipModels,
} from "./types/ModelContent";
import { ModelSerializer } from "./ModelSerializer";
import { JSONObject } from "kuzzle-sdk";
import { addSchemaToCache, getAJVErrors } from "../shared/utils/AJValidator";
import { SchemaValidationError } from "../shared/errors/SchemaValidationError";
import { getNamedMeasuresDuplicates } from "./MeasuresDuplicates";
import { MeasuresNamesDuplicatesError } from "./MeasuresNamesDuplicatesError";
import { KuzzleLogger } from "kuzzle-logger";
import {
  MetadataModelContent,
  checkMetadataReferentialEntry,
  fetchMetadataReferential,
  fetchReferencingModels,
  reResolveModel,
  resolveModel,
  saveMetadataReferential,
} from "./MetadataReferential";
import _ from "lodash";

export class ModelsRegister {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private assetModels: AssetModelContent[] = [];
  private deviceModels: DeviceModelContent[] = [];
  private groupModels: GroupModelContent[] = [];
  private measureModels: MeasureModelContent[] = [];
  private metadataReferential: MetadataReferential = {};
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
    const referential = await this.loadMetadataReferential();

    await Promise.all([
      this.load("asset", this.resolveModels(referential, this.assetModels)),
      this.load("device", this.resolveModels(referential, this.deviceModels)),
      this.load("group", this.resolveModels(referential, this.groupModels)),
      this.load("measure", this.measureModels),
    ]);

    await this.sdk.collection.refresh(
      this.config.platformIndex,
      InternalCollection.MODELS,
    );

    await this.resolveStoredModels(referential);
  }

  /**
   * Merges the metadata registered from code over the stored metadata referential and saves it.
   * Metadata added through the API are kept, metadata registered from code win.
   */
  private async loadMetadataReferential(): Promise<MetadataReferential> {
    const stored = await fetchMetadataReferential(
      this.sdk,
      this.config.platformIndex,
    );
    // ? Only the metadata still registered from code are managed, the others become editable through the API
    const referential: MetadataReferential = {
      ..._.mapValues(stored, (entry) => _.omit(entry, "managed")),
      ..._.mapValues(this.metadataReferential, (entry) => ({
        ...entry,
        managed: true,
      })),
    };

    if (!_.isEqual(stored, referential)) {
      await saveMetadataReferential(
        this.sdk,
        this.config.platformIndex,
        referential,
      );
    }

    this.logger.info(
      `Successfully load metadata referential: ${Object.keys(referential).join(", ")}`,
    );

    return referential;
  }

  /**
   * Resolves the metadata references of models registered from code
   */
  private resolveModels<T extends MetadataModelContent>(
    referential: MetadataReferential,
    models: T[],
  ): T[] {
    return models.map((model) => {
      const { content, ignored, warnings } = resolveModel(
        referential,
        model,
        (message) => new PluginImplementationError(message),
      );

      // ? Only logged, rejecting would prevent the application from starting
      for (const warning of [...ignored, ...warnings]) {
        this.logger.warn(warning);
      }

      return content;
    });
  }

  /**
   * Resolves again the stored models (e.g. written through the API) referencing the metadata referential,
   * so they take in the metadata registered from code.
   */
  private async resolveStoredModels(referential: MetadataReferential) {
    const registeredIds = new Set([
      ...this.assetModels.map((model) => ModelSerializer.id("asset", model)),
      ...this.deviceModels.map((model) => ModelSerializer.id("device", model)),
      ...this.groupModels.map((model) => ModelSerializer.id("group", model)),
    ]);

    const storedModels = await fetchReferencingModels(
      this.sdk,
      this.config.platformIndex,
    );

    const documents = [];

    for (const { _id, _source } of storedModels) {
      if (registeredIds.has(_id)) {
        continue;
      }

      const { content } = reResolveModel(
        referential,
        _source,
        (message) => new PluginImplementationError(message),
      );

      if (!_.isEqual(content, _source)) {
        documents.push({ _id, body: content });
      }
    }

    if (documents.length === 0) {
      return;
    }

    await this.sdk.document.mCreateOrReplace(
      this.config.platformIndex,
      InternalCollection.MODELS,
      documents,
      { refresh: "wait_for", strict: true },
    );

    this.logger.info(
      `Successfully resolved metadata of ${documents.length} stored models`,
    );
  }

  /**
   * Registers a metadata in the metadata referential.
   * Asset, device and group models can then reference it by name.
   * Registering again an identical definition is allowed, so several modules can share a metadata.
   *
   * @param name - Name of the metadata
   * @param definition - Mappings, default translations, editor hint, default value and icon of the metadata
   * @throws PluginImplementationError if the metadata is invalid or already registered with another definition
   */
  registerMetadata(name: string, definition: MetadataReferentialEntry) {
    checkMetadataReferentialEntry(
      name,
      definition,
      (message) => new PluginImplementationError(message),
    );

    const entry = { locales: {}, ..._.omit(definition, "managed") };
    const registered = this.metadataReferential[name];

    if (registered && !_.isEqual(registered, entry)) {
      throw new PluginImplementationError(
        `Metadata "${name}" is already registered in the metadata referential with another definition`,
      );
    }

    this.metadataReferential[name] = entry;
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
   * @param metadataReferences - Optional metadata referenced from the metadata referential.
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
    metadataReferences: MetadataReferences = {},
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
        metadataReferences,
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
   * @param metadataReferences - Optional metadata referenced from the metadata referential.
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
    metadataReferences: MetadataReferences = {},
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
        metadataReferences,
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
   * @param locales - Optional translations specific to the model.
   * @param metadataReferences - Optional metadata referenced from the metadata referential.
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
    locales: { [valueName: string]: LocaleDetails } = {},
    metadataReferences: MetadataReferences = {},
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
        locales,
        metadataDetails,
        metadataGroups,
        metadataMappings,
        metadataReferences,
        model,
      },
      type: "group",
    });
  }

  registerMeasure(type: string, measureDefinition: MeasureDefinition) {
    const { icon, locales, validationSchema, valuesMappings, valuesDetails } =
      measureDefinition;
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
        type,
        validationSchema,
        valuesDetails,
        valuesMappings,
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
