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
  enrichModelMetadata,
  fetchMetadataModels,
  fetchMetadataReferential,
  getEntryModelsConflicts,
  saveMetadataReferential,
} from "./MetadataReferential";
import { ask } from "kuzzle-plugin-commons";
import { AskEngineMetadataConflict } from "../plugin/DeviceManagerEngine";
import { ConflictChunk } from "./ModelsConflicts";
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
  }

  /**
   * Merges the metadata registered from code over the stored metadata referential and saves it.
   * Metadata added through the API are kept, the details of metadata registered from code win.
   *
   * @throws PluginImplementationError if the mappings of a stored metadata are modified, or if a new
   *  metadata conflicts with the stored models or the engines collections mappings
   */
  private async loadMetadataReferential(): Promise<MetadataReferential> {
    const stored = await fetchMetadataReferential(
      this.sdk,
      this.config.platformIndex,
    );

    const added = Object.keys(this.metadataReferential).filter(
      (name) => !stored[name],
    );

    for (const [name, entry] of Object.entries(this.metadataReferential)) {
      if (stored[name] && !_.isEqual(stored[name].mappings, entry.mappings)) {
        throw new PluginImplementationError(
          `The mappings of metadata "${name}" cannot be modified, they are already merged into the engines collections`,
        );
      }
    }

    await this.checkNewMetadata(added);

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
   * Checks the metadata registered from code that are not in the stored referential yet
   * against the inline metadata of the stored models and the engines collections mappings
   *
   * @throws PluginImplementationError on a conflict
   */
  private async checkNewMetadata(names: string[]) {
    if (names.length === 0) {
      return;
    }

    const models = (
      await fetchMetadataModels(this.sdk, this.config.platformIndex)
    ).map(({ _source }) => _source);
    const conflicts: ConflictChunk[] = [];

    for (const name of names) {
      conflicts.push(
        ...getEntryModelsConflicts(
          name,
          this.metadataReferential[name],
          models,
        ),
      );
    }

    conflicts.push(
      ...(await ask<AskEngineMetadataConflict>(
        "ask:device-manager:engine:doesMetadataConflict",
        {
          metadataMappings: _.mapValues(
            _.pick(this.metadataReferential, names),
            (entry) => entry.mappings,
          ),
        },
      )),
    );

    if (conflicts.length > 0) {
      throw new PluginImplementationError(
        `Metadata registered from code conflict with the existing mappings: ${JSON.stringify(conflicts)}`,
      );
    }
  }

  /**
   * Validates the metadata of models registered from code against the metadata referential
   * and enriches the details and default values of the metadata coming from it
   */
  private resolveModels<T extends MetadataModelContent>(
    referential: MetadataReferential,
    models: T[],
  ): T[] {
    return models.map((content) => {
      const twin = content[content.type];
      const { fields, warnings } = enrichModelMetadata(referential, twin, {
        createError: (message) => new PluginImplementationError(message),
        model: twin.model,
        modelType: content.type,
      });

      // ? Only logged, rejecting would prevent the application from starting
      for (const warning of warnings) {
        this.logger.warn(warning);
      }

      return { ...content, [content.type]: { ...twin, ...fields } };
    });
  }

  /**
   * Registers a metadata in the metadata referential.
   * Asset, device and group models can then use it with `{ referential: true }` in their metadataMappings.
   * Its mappings cannot be modified once loaded, they are merged into the engines collections.
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
   * @param locales - Optional translations specific to the model.
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
