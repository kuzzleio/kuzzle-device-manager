import {
  BadRequestError,
  EventGenericDocumentAfterUpdate,
  EventGenericDocumentBeforeUpdate,
  EventGenericDocumentBeforeWrite,
  Inflector,
  KDocumentContent,
  KuzzleRequest,
  NotFoundError,
} from "kuzzle";
import { ask, onAsk } from "kuzzle-plugin-commons";
import { JSONObject, KDocument, KHit, SearchResult } from "kuzzle-sdk";

import {
  AskEngineUpdateAll,
  AskEngineUpdateConflict,
  DeviceManagerPlugin,
  InternalCollection,
} from "../plugin";

import { AskAssetRefreshModel } from "../asset";
import { BaseService, SearchParams, flattenObject } from "../shared";
import { ModelSerializer } from "./ModelSerializer";
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
import {
  AskModelAssetGet,
  AskModelDeviceGet,
  AskModelGroupGet,
  AskModelMeasureGet,
  AskModelMetadataReferentialGet,
} from "./types/ModelEvents";
import { MappingsConflictsError } from "./MappingsConflictsError";
import { SchemaObject } from "ajv";
import { addSchemaToCache, getAJVErrors } from "../shared/utils/AJValidator";
import { SchemaValidationError } from "../shared/errors/SchemaValidationError";
import { MeasureValuesDetails } from "../measure";
import { NamedMeasures } from "../decoder";
import { getNamedMeasuresDuplicates } from "./MeasuresDuplicates";
import { MeasuresNamesDuplicatesError } from "./MeasuresNamesDuplicatesError";
import { AskDeviceRefreshModel } from "../device";
import { AskGroupRefreshModel } from "../group/types/GroupEvents";
import { KuzzleLogger } from "kuzzle-logger";
import isEqual from "lodash/isEqual";
import omit from "lodash/omit";
import {
  MetadataEnrichment,
  MetadataModelContent,
  MetadataModelType,
  ModelMetadataFields,
  checkMetadataReferentialEntry,
  enrichModelMetadata,
  fetchMetadataModels,
  fetchMetadataReferential,
  fetchReferencingModels,
  getAddedInlineMetadata,
  getEntryModelsConflicts,
  isReferentialMapping,
  resolveModelMetadata,
  withMetadataReferentialLock,
  saveMetadataReferential,
} from "./MetadataReferential";
import { AskEngineMetadataConflict } from "../plugin/DeviceManagerEngine";

/**
 * Fields of a group model update.
 * Affinity and icon are kept when omitted.
 */
export type GroupModelUpdate = {
  affinity?: JSONObject;
  defaultMetadata: JSONObject;
  icon?: string;
  locales: { [valueName: string]: LocaleDetails };
  metadataDetails: MetadataDetails;
  metadataGroups: MetadataGroups;
  metadataMappings: MetadataMappings;
};

/**
 * Fields of a device model update.
 * Metadata details and default values are kept when omitted.
 */
export type DeviceModelUpdate = {
  defaultMetadata?: JSONObject;
  metadataDetails?: MetadataDetails;
  metadataMappings: MetadataMappings;
};

function getAssetModelScope(
  tenantClasses: string[] | undefined,
  indexes: string[] | undefined,
): "global" | "tenant" | "group" {
  if (indexes?.length > 0) {
    return "tenant";
  }
  return tenantClasses?.includes("commons") ? "global" : "group";
}

export class ModelService extends BaseService {
  readonly logger: KuzzleLogger;
  constructor(plugin: DeviceManagerPlugin, logger: KuzzleLogger) {
    super(plugin);
    this.logger = logger;
    this.registerAskEvents();
  }

  registerAskEvents() {
    onAsk<AskModelAssetGet>(
      "ask:device-manager:model:asset:get",
      async ({ tenantClasses, index, model }) => {
        const assetModel = await this.getAsset(tenantClasses, index, model);

        return assetModel._source;
      },
    );
    onAsk<AskModelDeviceGet>(
      "ask:device-manager:model:device:get",
      async ({ model }) => {
        const deviceModel = await this.getDevice(model);

        return deviceModel._source;
      },
    );
    onAsk<AskModelGroupGet>(
      "ask:device-manager:model:group:get",
      async ({ model }) => {
        const groupModel = await this.getGroup(model);

        return groupModel._source;
      },
    );
    onAsk<AskModelMetadataReferentialGet>(
      "ask:device-manager:model:metadata-referential:get",
      async () => this.getMetadataReferential(),
    );
    onAsk<AskModelMeasureGet>(
      "ask:device-manager:model:measure:get",
      async ({ type, index }) => {
        const measureModel = await this.getMeasure(type, index);

        return measureModel._source;
      },
    );

    const genericModelsHandler = async (
      documents: KDocument<KDocumentContent>[],
      request: KuzzleRequest,
    ) => {
      const { index, collection } = request.input.args;

      if (index === this.config.platformIndex && collection === "models") {
        const models = documents.map((elt) => {
          return elt._source;
        }) as ModelContent[];

        await this.checkModelsConflicts(models);
      }

      return documents;
    };

    this.app.pipe.register<EventGenericDocumentBeforeWrite>(
      "generic:document:beforeWrite",
      genericModelsHandler,
    );
    this.app.pipe.register<EventGenericDocumentBeforeUpdate>(
      "generic:document:beforeUpdate",
      genericModelsHandler,
    );

    this.app.hook.register<EventGenericDocumentAfterUpdate>(
      "generic:document:afterUpdate",
      async (documents, request) => {
        const { index, collection } = request.input.args;

        if (index === this.config.platformIndex && collection === "models") {
          await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");
        }
      },
    );
  }

  private async checkModelsConflicts(documents: ModelContent[]) {
    const assets = documents.filter((elt) => {
      return elt.type === "asset";
    }) as AssetModelContent[];

    const devices = documents.filter((elt) => {
      return elt.type === "device";
    }) as DeviceModelContent[];

    const groups = documents.filter((elt) => {
      return elt.type === "group";
    }) as GroupModelContent[];

    const measures = documents.filter((elt) => {
      return elt.type === "measure";
    }) as MeasureModelContent[];

    if (assets.length > 0) {
      const conflicts = await ask<AskEngineUpdateConflict>(
        "ask:device-manager:engine:doesUpdateConflict",
        {
          twin: {
            models: assets,
            type: "asset",
          },
        },
      );

      if (conflicts.length > 0) {
        throw new MappingsConflictsError(
          `New assets mappings are causing conflicts`,
          conflicts,
        );
      }
    }

    if (devices.length > 0) {
      const conflicts = await ask<AskEngineUpdateConflict>(
        "ask:device-manager:engine:doesUpdateConflict",
        {
          twin: {
            models: devices,
            type: "device",
          },
        },
      );

      if (conflicts.length > 0) {
        throw new MappingsConflictsError(
          `New devices mappings are causing conflicts`,
          conflicts,
        );
      }
    }

    if (groups.length > 0) {
      const conflicts = await ask<AskEngineUpdateConflict>(
        "ask:device-manager:engine:doesUpdateConflict",
        {
          groupModels: groups,
        },
      );

      if (conflicts.length > 0) {
        throw new MappingsConflictsError(
          `New group mappings are causing conflicts`,
          conflicts,
        );
      }
    }

    if (measures.length > 0) {
      const conflicts = await ask<AskEngineUpdateConflict>(
        "ask:device-manager:engine:doesUpdateConflict",
        {
          measuresModels: measures,
        },
      );

      if (conflicts.length > 0) {
        throw new MappingsConflictsError(
          `New measures mappings are causing conflicts`,
          conflicts,
        );
      }
    }
  }

  private checkDefaultValues(
    metadataMappings: MetadataMappings,
    defaultMetadata: JSONObject,
  ) {
    const flattenedMetadataMappings = flattenObject(metadataMappings);

    const metadata = Object.keys(
      JSON.parse(
        JSON.stringify(flattenedMetadataMappings)
          .replace(/properties\./g, "")
          .replace(/\.type/g, ""),
      ),
    );

    const values = Object.keys(flattenObject(defaultMetadata));

    for (let i = 0; i < values.length; i++) {
      const key = values[i];

      // ? Check if the exact key exists in the metadata
      if (!metadata.includes(key)) {
        // ? Extract base key for complex types like geo_point or geo_shape
        const baseKey = key.includes(".") ? key.split(".")[0] : key;

        // ? Check if the base key is in the metadata
        if (!metadata.includes(baseKey)) {
          throw new BadRequestError(
            `The default value "${key}" is not in the metadata mappings.`,
          );
        }

        // ? Accept nested properties for geo_point or geo_shape
        const baseKeyMetadata = flattenedMetadataMappings[`${baseKey}.type`];
        if (
          baseKeyMetadata === "geo_point" ||
          baseKeyMetadata === "geo_shape"
        ) {
          continue;
        }

        throw new BadRequestError(
          `The default value "${values[i]}" is not in the metadata mappings.`,
        );
      }
    }
  }

  private checkGroupAffinity(affinity: JSONObject): GroupAffinity {
    const { type, strict, models } = affinity;

    if (!type || strict === undefined || !models) {
      throw new BadRequestError(
        `The group affinity must specify a type array, models and strictness`,
      );
    }
    if (
      !Array.isArray(type) ||
      type.length > 2 ||
      type.length < 1 ||
      !type.every((t) => ["assets", "devices"].includes(t))
    ) {
      throw new BadRequestError(
        `The group type must be an array containing "assets" and/or "devices"`,
      );
    }
    if (typeof strict !== "boolean") {
      throw new BadRequestError(
        `The group affinity strict field must be a boolean`,
      );
    }
    for (const t of type) {
      if (!models[t] || !Array.isArray(models[t])) {
        throw new BadRequestError(
          `The group affinity must contain an array for every present type`,
        );
      }
      if (!models[t].every((model) => typeof model === "string")) {
        throw new BadRequestError(
          `The group affinity models must be an array of models id`,
        );
      }
    }
    return { models, strict, type };
  }

  private validateAssetModel(
    model: string,
    measures: NamedMeasures,
    tenantClasses: string[],
    indexes?: string[],
  ) {
    if (Inflector.pascalCase(model) !== model) {
      throw new BadRequestError(`Asset model "${model}" must be PascalCase.`);
    }

    if (indexes?.length && tenantClasses?.length) {
      throw new BadRequestError(
        `"indexes" and "tenantClasses" are mutually exclusive on an asset model.`,
      );
    }

    const duplicates = getNamedMeasuresDuplicates(measures);

    if (duplicates.length > 0) {
      throw new MeasuresNamesDuplicatesError(
        "Asset model measures contain one or multiple duplicate measure name",
        duplicates,
      );
    }
  }

  /**
   * Anti-shadowing: rejects the model if one with the same name exists at a different scope level
   */
  private async checkAssetModelScope(
    model: string,
    normalizedTenantClasses: string[],
    indexes?: string[],
  ) {
    const scope = getAssetModelScope(normalizedTenantClasses, indexes);

    await this.sdk.collection.refresh(
      this.config.platformIndex,
      InternalCollection.MODELS,
    );
    const existing = await this.sdk.document.search(
      this.config.platformIndex,
      InternalCollection.MODELS,
      {
        query: {
          bool: {
            must: [
              { term: { type: "asset" } },
              { term: { "asset.model": model } },
            ],
          },
        },
      },
      { size: 10 },
    );
    for (const hit of existing.hits) {
      const doc = hit._source as AssetModelContent;
      const docScope = getAssetModelScope(doc.tenantClasses, doc.indexes);

      // Same scope level: allow overwrite
      if (scope === docScope) {
        continue;
      }

      // Different scope levels: reject
      if (docScope === "global") {
        throw new BadRequestError(
          `Asset model "${model}" already exists as a global (commons) model. A model cannot exist at multiple scopes.`,
        );
      }
      if (scope === "global") {
        throw new BadRequestError(
          `Asset model "${model}" already exists at a non-global scope. A model cannot exist at multiple scopes.`,
        );
      }
      if (scope === "tenant") {
        throw new BadRequestError(
          `Asset model "${model}" already exists at group scope. A model cannot be both group-scoped and tenant-scoped.`,
        );
      }
      throw new BadRequestError(
        `Asset model "${model}" already exists at tenant scope. A model cannot be both group-scoped and tenant-scoped.`,
      );
    }
  }

  async writeAsset(
    tenantClasses: string[],
    model: string,
    metadataMappings: MetadataMappings,
    defaultMetadata: JSONObject,
    metadataDetails: MetadataDetails,
    metadataGroups: MetadataGroups,
    measures: NamedMeasures,
    tooltipModels: TooltipModels,
    locales: { [valueName: string]: LocaleDetails },
    indexes?: string[],
    icon?: string,
  ): Promise<KDocument<AssetModelContent>> {
    return withMetadataReferentialLock(async () => {
      this.validateAssetModel(model, measures, tenantClasses, indexes);

      const normalizedTenantClasses = tenantClasses.includes("commons")
        ? ["commons"]
        : tenantClasses;

      await this.checkAssetModelScope(model, normalizedTenantClasses, indexes);

      const { fields: metadata, resolvedMappings } = await this.resolveMetadata(
        "asset",
        model,
        { defaultMetadata, metadataDetails, metadataMappings },
      );

      const modelContent: AssetModelContent = {
        asset: {
          ...metadata,
          icon,
          locales,
          measures,
          metadataGroups,
          model,
          tooltipModels,
        },
        ...(indexes?.length
          ? { indexes }
          : { tenantClasses: normalizedTenantClasses }),
        type: "asset",
      } as AssetModelContent;

      const modelId = ModelSerializer.id<AssetModelContent>(
        "asset",
        modelContent,
      );
      const stored = await this.getStoredModel<AssetModelContent>(modelId);

      this.checkReferentialOnly("asset", model, metadataMappings, stored);

      this.checkDefaultValues(resolvedMappings, metadata.defaultMetadata);

      const conflicts = await ask<AskEngineUpdateConflict>(
        "ask:device-manager:engine:doesUpdateConflict",
        { twin: { models: [modelContent], type: "asset" } },
      );

      if (conflicts.length > 0) {
        throw new MappingsConflictsError(
          `New assets mappings are causing conflicts`,
          conflicts,
        );
      }

      const assetModel =
        await this.sdk.document.createOrReplace<AssetModelContent>(
          this.config.platformIndex,
          InternalCollection.MODELS,
          ModelSerializer.id<AssetModelContent>("asset", modelContent),
          modelContent,
        );

      await this.sdk.collection.refresh(
        this.config.platformIndex,
        InternalCollection.MODELS,
      );
      await this.updateEnginesOrRestore(modelId, stored);

      await ask<AskAssetRefreshModel>(
        "ask:device-manager:asset:refresh-model",
        {
          assetModel: assetModel._source,
        },
      );

      return assetModel;
    });
  }

  async writeDevice(
    model: string,
    metadataMappings: MetadataMappings,
    defaultMetadata: JSONObject,
    metadataDetails: MetadataDetails,
    metadataGroups: MetadataGroups,
    measures: NamedMeasures,
    icon?: string,
  ): Promise<KDocument<DeviceModelContent>> {
    return withMetadataReferentialLock(async () => {
      if (Inflector.pascalCase(model) !== model) {
        throw new BadRequestError(
          `Device model "${model}" must be PascalCase.`,
        );
      }

      const duplicates = getNamedMeasuresDuplicates(measures);

      if (duplicates.length > 0) {
        throw new MeasuresNamesDuplicatesError(
          "Device model measures contain one or multiple duplicate measure name",
          duplicates,
        );
      }

      const { fields: metadata } = await this.resolveMetadata("device", model, {
        defaultMetadata,
        metadataDetails,
        metadataMappings,
      });

      const modelContent: DeviceModelContent = {
        device: {
          ...metadata,
          icon,
          measures,
          metadataGroups,
          model,
        },
        type: "device",
      };

      const modelId = ModelSerializer.id<DeviceModelContent>(
        "device",
        modelContent,
      );
      const stored = await this.getStoredModel<DeviceModelContent>(modelId);

      this.checkReferentialOnly("device", model, metadataMappings, stored);

      const conflicts = await ask<AskEngineUpdateConflict>(
        "ask:device-manager:engine:doesUpdateConflict",
        { twin: { models: [modelContent], type: "device" } },
      );

      if (conflicts.length > 0) {
        throw new MappingsConflictsError(
          `New devices mappings are causing conflicts`,
          conflicts,
        );
      }

      const deviceModel =
        await this.sdk.document.createOrReplace<DeviceModelContent>(
          this.config.platformIndex,
          InternalCollection.MODELS,
          ModelSerializer.id<DeviceModelContent>("device", modelContent),
          modelContent,
        );

      await this.sdk.collection.refresh(
        this.config.platformIndex,
        InternalCollection.MODELS,
      );
      await this.updateEnginesOrRestore(modelId, stored);

      await ask<AskDeviceRefreshModel>(
        "ask:device-manager:device:refresh-model",
        {
          deviceModel: modelContent,
        },
      );

      return deviceModel;
    });
  }

  /* NOSONAR: same signature as write* */ async writeGroup(
    tenantClasses: string[],
    model: string,
    affinity: JSONObject,
    metadataMappings: MetadataMappings,
    defaultMetadata: JSONObject,
    metadataDetails: MetadataDetails,
    metadataGroups: MetadataGroups,
    icon?: string,
    locales?: { [valueName: string]: LocaleDetails },
  ): Promise<KDocument<GroupModelContent>> {
    return withMetadataReferentialLock(async () => {
      if (Inflector.pascalCase(model) !== model) {
        throw new BadRequestError(`Group model "${model}" must be PascalCase.`);
      }
      if (tenantClasses.includes("commons")) {
        tenantClasses = ["commons"];
      }

      const groupAffinity = this.checkGroupAffinity(affinity);
      const { fields: metadata } = await this.resolveMetadata("group", model, {
        defaultMetadata,
        metadataDetails,
        metadataMappings,
      });

      const modelContent: GroupModelContent = {
        tenantClasses,
        group: {
          ...metadata,
          affinity: groupAffinity,
          icon,
          locales,
          metadataGroups,
          model,
        },
        type: "group",
      };

      const modelId = ModelSerializer.id<GroupModelContent>(
        "group",
        modelContent,
      );
      const stored = await this.getStoredModel<GroupModelContent>(modelId);

      this.checkReferentialOnly("group", model, metadataMappings, stored);

      const conflicts = await ask<AskEngineUpdateConflict>(
        "ask:device-manager:engine:doesUpdateConflict",
        { groupModels: [modelContent] },
      );

      if (conflicts.length > 0) {
        throw new MappingsConflictsError(
          `New group mappings are causing conflicts`,
          conflicts,
        );
      }

      const groupModel =
        await this.sdk.document.createOrReplace<GroupModelContent>(
          this.config.platformIndex,
          InternalCollection.MODELS,
          ModelSerializer.id<GroupModelContent>("group", modelContent),
          modelContent,
        );

      await this.sdk.collection.refresh(
        this.config.platformIndex,
        InternalCollection.MODELS,
      );
      await this.updateEnginesOrRestore(modelId, stored);

      return groupModel;
    });
  }

  async writeMeasure(
    type: string,
    valuesMappings: JSONObject,
    validationSchema?: SchemaObject,
    valuesDetails?: MeasureValuesDetails,
    locales?: {
      [valueName: string]: LocaleDetails;
    },
    indexes?: string[],
    icon?: string,
  ): Promise<KDocument<MeasureModelContent>> {
    const modelContent: MeasureModelContent = {
      measure: {
        icon,
        locales,
        type,
        valuesDetails,
        valuesMappings,
      },
      type: "measure",
    };

    if (indexes?.length) {
      modelContent.indexes = indexes;
    }

    // Anti-shadowing: a measure type must be either global or tenant-scoped, not both
    await this.checkMeasureShadowing(type, indexes);

    if (validationSchema) {
      try {
        addSchemaToCache(type, validationSchema);
        modelContent.measure.validationSchema = validationSchema;
      } catch (error) {
        throw new SchemaValidationError(
          "Provided schema is not valid",
          getAJVErrors(),
        );
      }
    }

    const conflicts = await ask<AskEngineUpdateConflict>(
      "ask:device-manager:engine:doesUpdateConflict",
      { measuresModels: [modelContent] },
    );

    if (conflicts.length > 0) {
      throw new MappingsConflictsError(
        `New assets mappings are causing conflicts`,
        conflicts,
      );
    }

    const modelId = ModelSerializer.id<MeasureModelContent>(
      "measure",
      modelContent,
    );
    const stored = await this.getStoredModel<MeasureModelContent>(modelId);

    const measureModel =
      await this.sdk.document.createOrReplace<MeasureModelContent>(
        this.config.platformIndex,
        InternalCollection.MODELS,
        modelId,
        modelContent,
      );

    await this.sdk.collection.refresh(
      this.config.platformIndex,
      InternalCollection.MODELS,
    );
    await this.updateEnginesOrRestore(modelId, stored);

    return measureModel;
  }

  async deleteAsset(_id: string) {
    await this.sdk.document.delete(
      this.config.platformIndex,
      InternalCollection.MODELS,
      _id,
    );
  }

  async deleteDevice(_id: string) {
    await this.sdk.document.delete(
      this.config.platformIndex,
      InternalCollection.MODELS,
      _id,
    );
  }

  async deleteGroup(_id: string) {
    await this.sdk.document.delete(
      this.config.platformIndex,
      InternalCollection.MODELS,
      _id,
    );
  }

  async deleteMeasure(_id: string) {
    await this.sdk.document.delete(
      this.config.platformIndex,
      InternalCollection.MODELS,
      _id,
    );
  }

  /**
   * List all asset models regardless of tenant class scope.
   * Used for super admin global view.
   */
  async listAllAssets(): Promise<KDocument<AssetModelContent>[]> {
    const result = await this.sdk.document.search(
      this.config.platformIndex,
      InternalCollection.MODELS,
      { query: { term: { type: "asset" } } },
      { size: 5000, sort: [{ "asset.model": "asc" }] },
    );

    return result.hits as unknown as KDocument<AssetModelContent>[];
  }

  /**
   * Check if an engine (tenant) exists by its ID.
   */
  async engineExists(index: string): Promise<boolean> {
    try {
      const result = await this.sdk.document.search(
        this.config.platformIndex,
        InternalCollection.CONFIG,
        {
          query: {
            bool: {
              must: [
                { term: { type: "engine-device-manager" } },
                { term: { "engine.index": index } },
              ],
            },
          },
        },
        { size: 1 },
      );
      return result.total > 0;
    } catch {
      return false;
    }
  }

  /**
   * Find tenant classes that don't exist.
   */
  async findInvalidTenantClasses(tenantClasses: string[]): Promise<string[]> {
    // "commons" is always valid
    const toCheck = tenantClasses.filter((g) => g !== "commons");
    if (toCheck.length === 0) {
      return [];
    }

    const result = await this.sdk.document.search(
      this.config.platformIndex,
      InternalCollection.CONFIG,
      {
        query: {
          equals: { type: "engine-device-manager" },
        },
      },
      { lang: "koncorde", size: 5000 },
    );

    const existingTenantClasses = new Set(
      result.hits.map(
        (h) => (h._source as { engine?: { group?: string } }).engine?.group,
      ),
    );

    return toCheck.filter((g) => !existingTenantClasses.has(g));
  }

  async listAsset(
    tenantClasses: string[],
    index?: string,
  ): Promise<KDocument<AssetModelContent>[]> {
    const result = await this.searchAssets(tenantClasses, index, {
      searchBody: {
        sort: { "asset.model": "asc" },
      },
      size: 5000,
    });

    return result.hits;
  }

  async listDevices(): Promise<KDocument<DeviceModelContent>[]> {
    const result = await this.searchDevices({
      searchBody: {
        sort: { "device.model": "asc" },
      },
      size: 5000,
    });

    return result.hits;
  }

  async listGroups(
    tenantClasses: string[],
  ): Promise<KDocument<GroupModelContent>[]> {
    const result = await this.searchGroups(tenantClasses, {
      searchBody: {
        sort: { "group.model": "asc" },
      },
      size: 5000,
    });

    return result.hits;
  }

  async listMeasures(
    index?: string,
  ): Promise<KDocument<MeasureModelContent>[]> {
    const result = await this.searchMeasures(index, {
      searchBody: {
        sort: { "measure.type": "asc" },
      },
      size: 5000,
    });

    return result.hits;
  }

  searchAssets(
    tenantClasses: string[],
    index: string | undefined,
    searchParams: Partial<SearchParams>,
  ): Promise<SearchResult<KHit<AssetModelContent>>> {
    const scopeFilter = index
      ? {
          bool: {
            should: [
              {
                bool: {
                  must: [{ term: { indexes: index } }],
                },
              },
              {
                bool: {
                  must: [{ terms: { tenantClasses } }],
                  must_not: [{ exists: { field: "indexes" } }],
                },
              },
              {
                bool: {
                  must: [{ term: { tenantClasses: "commons" } }],
                  must_not: [{ exists: { field: "indexes" } }],
                },
              },
            ],
          },
        }
      : {
          bool: {
            should: [
              {
                bool: {
                  must: [{ terms: { tenantClasses } }],
                  must_not: [{ exists: { field: "indexes" } }],
                },
              },
              {
                bool: {
                  must: [{ term: { tenantClasses: "commons" } }],
                  must_not: [{ exists: { field: "indexes" } }],
                },
              },
            ],
          },
        };

    const query = {
      bool: {
        must: [
          searchParams.searchBody.query,
          { term: { type: "asset" } },
          scopeFilter,
        ].filter(Boolean),
      },
    };

    return this.sdk.document.search<AssetModelContent>(
      this.config.platformIndex,
      InternalCollection.MODELS,
      {
        ...searchParams.searchBody,
        query,
      },
      {
        from: searchParams.from,
        lang: "elasticsearch",
        scroll: searchParams.scrollTTL,
        size: searchParams.size,
      },
    );
  }

  searchDevices(
    searchParams: Partial<SearchParams>,
  ): Promise<SearchResult<KHit<DeviceModelContent>>> {
    const query = {
      bool: {
        must: [
          searchParams.searchBody.query,
          { term: { type: "device" } },
        ].filter(Boolean),
      },
    };

    return this.sdk.document.search<DeviceModelContent>(
      this.config.platformIndex,
      InternalCollection.MODELS,
      {
        ...searchParams.searchBody,
        query,
      },
      {
        from: searchParams.from,
        lang: "elasticsearch",
        scroll: searchParams.scrollTTL,
        size: searchParams.size,
      },
    );
  }

  searchGroups(
    tenantClasses: string[],
    searchParams: Partial<SearchParams>,
  ): Promise<SearchResult<KHit<GroupModelContent>>> {
    const query = {
      bool: {
        must: [
          searchParams.searchBody.query,
          { term: { type: "group" } },
          {
            bool: {
              should: [
                { terms: { tenantClasses } },
                { term: { tenantClasses: "commons" } },
              ],
            },
          },
        ].filter(Boolean),
      },
    };

    return this.sdk.document.search<GroupModelContent>(
      this.config.platformIndex,
      InternalCollection.MODELS,
      {
        ...searchParams.searchBody,
        query,
      },
      {
        from: searchParams.from,
        lang: "elasticsearch",
        scroll: searchParams.scrollTTL,
        size: searchParams.size,
      },
    );
  }

  searchMeasures(
    index: string | undefined,
    searchParams: Partial<SearchParams>,
  ): Promise<SearchResult<KHit<MeasureModelContent>>> {
    const scopeFilter = index
      ? {
          bool: {
            should: [
              { term: { indexes: index } },
              { bool: { must_not: [{ exists: { field: "indexes" } }] } },
            ],
          },
        }
      : {
          bool: {
            must_not: [{ exists: { field: "indexes" } }],
          },
        };

    const query = {
      bool: {
        must: [
          searchParams.searchBody.query,
          { term: { type: "measure" } },
          scopeFilter,
        ].filter(Boolean),
      },
    };

    return this.sdk.document.search<MeasureModelContent>(
      this.config.platformIndex,
      InternalCollection.MODELS,
      {
        ...searchParams.searchBody,
        query,
      },
      {
        from: searchParams.from,
        lang: "elasticsearch",
        scroll: searchParams.scrollTTL,
        size: searchParams.size,
      },
    );
  }

  async assetExists(model: string): Promise<boolean> {
    const query = {
      and: [
        { equals: { type: "asset" } },
        { equals: { "asset.model": model } },
      ],
    };

    const result = await this.sdk.document.search(
      this.config.platformIndex,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 1 },
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
      this.config.platformIndex,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 1 },
    );

    return result.total > 0;
  }

  async getAsset(
    tenantClasses: string[],
    index: string | undefined,
    model: string,
  ): Promise<KDocument<AssetModelContent>> {
    const baseFilter = [
      { term: { type: "asset" } },
      { term: { "asset.model": model } },
    ];

    // Priority 1: tenant-scoped model for this specific engine
    if (index) {
      const tenantQuery = {
        bool: {
          must: [...baseFilter, { term: { indexes: index } }],
        },
      };

      const tenantResult = await this.sdk.document.search<AssetModelContent>(
        this.config.platformIndex,
        InternalCollection.MODELS,
        { query: tenantQuery },
        { lang: "elasticsearch", size: 1 },
      );

      if (tenantResult.total > 0) {
        return tenantResult.hits[0];
      }
    }

    // Priority 2: group-scoped model (no indexes field)
    const groupQuery = {
      bool: {
        must: [...baseFilter, { terms: { tenantClasses } }],
        must_not: [{ exists: { field: "indexes" } }],
      },
    };

    const groupResult = await this.sdk.document.search<AssetModelContent>(
      this.config.platformIndex,
      InternalCollection.MODELS,
      { query: groupQuery },
      { lang: "elasticsearch", size: 1 },
    );

    if (groupResult.total > 0) {
      return groupResult.hits[0];
    }

    // Priority 3: commons model
    const commonsQuery = {
      bool: {
        must: [...baseFilter, { term: { tenantClasses: "commons" } }],
        must_not: [{ exists: { field: "indexes" } }],
      },
    };

    const commonsResult = await this.sdk.document.search<AssetModelContent>(
      this.config.platformIndex,
      InternalCollection.MODELS,
      { query: commonsQuery },
      { lang: "elasticsearch", size: 1 },
    );

    if (commonsResult.total > 0) {
      return commonsResult.hits[0];
    }

    throw new NotFoundError(
      `Unknown Asset model "${model}" for tenantClasses ${tenantClasses.join(", ")}.`,
    );
  }

  async getDevice(model: string): Promise<KDocument<DeviceModelContent>> {
    const query = {
      and: [
        { equals: { type: "device" } },
        { equals: { "device.model": model } },
      ],
    };

    const result = await this.sdk.document.search<DeviceModelContent>(
      this.config.platformIndex,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 1 },
    );

    if (result.total === 0) {
      throw new NotFoundError(`Unknown Device model "${model}".`);
    }

    return result.hits[0];
  }

  async getGroup(model: string): Promise<KDocument<GroupModelContent>> {
    const query = {
      and: [
        { equals: { type: "group" } },
        { equals: { "group.model": model } },
      ],
    };

    const result = await this.sdk.document.search<GroupModelContent>(
      this.config.platformIndex,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 1 },
    );

    if (result.total === 0) {
      throw new NotFoundError(`Unknown Group model "${model}".`);
    }
    if (result.total > 1) {
      this.logger.warn(
        "More than 1 group definition have been found for this model",
      );
    }

    return result.hits[0];
  }

  async getMeasure(
    type: string,
    index?: string,
  ): Promise<KDocument<MeasureModelContent>> {
    const baseFilter = [
      { term: { type: "measure" } },
      { term: { "measure.type": type } },
    ];

    const scopeFilter = index
      ? {
          bool: {
            should: [
              { term: { indexes: index } },
              { bool: { must_not: [{ exists: { field: "indexes" } }] } },
            ],
          },
        }
      : {
          bool: {
            must_not: [{ exists: { field: "indexes" } }],
          },
        };

    const result = await this.sdk.document.search<MeasureModelContent>(
      this.config.platformIndex,
      InternalCollection.MODELS,
      {
        query: {
          bool: {
            must: [...baseFilter, scopeFilter],
          },
        },
      },
      { lang: "elasticsearch", size: 1 },
    );

    if (result.total > 0) {
      return result.hits[0];
    }

    throw new NotFoundError(`Unknown Measure type "${type}".`);
  }

  /**
   * Checks that creating/updating a measure model does not shadow an existing
   * one at a different scope (global vs tenant-scoped).
   */
  private async checkMeasureShadowing(
    type: string,
    indexes?: string[],
  ): Promise<void> {
    const isNewTenantScoped = indexes && indexes.length > 0;

    // Check for existing measures of the same type at the opposite scope
    const conflictQuery = isNewTenantScoped
      ? {
          // New is tenant-scoped → reject if a global measure exists
          bool: {
            must: [
              { term: { type: "measure" } },
              { term: { "measure.type": type } },
            ],
            must_not: [{ exists: { field: "indexes" } }],
          },
        }
      : {
          // New is global → reject if any tenant-scoped measure exists
          bool: {
            must: [
              { term: { type: "measure" } },
              { term: { "measure.type": type } },
              { exists: { field: "indexes" } },
            ],
          },
        };

    const result = await this.sdk.document.search<MeasureModelContent>(
      this.config.platformIndex,
      InternalCollection.MODELS,
      { query: conflictQuery },
      { lang: "elasticsearch", size: 1 },
    );

    if (result.total > 0) {
      const scope = isNewTenantScoped ? "global" : "tenant-scoped";
      throw new BadRequestError(
        `Measure type "${type}" already exists as a ${scope} measure. A measure type cannot be both global and tenant-scoped.`,
      );
    }
  }

  /**
   * Update an asset model
   */
  async updateAsset(
    tenantClasses: string[],
    index: string | undefined,
    model: string,
    metadataMappings: MetadataMappings,
    defaultMetadata: JSONObject,
    metadataDetails: MetadataDetails,
    metadataGroups: MetadataGroups,
    measures: AssetModelContent["asset"]["measures"],
    tooltipModels: TooltipModels,
    locales: { [valueName: string]: LocaleDetails },
    icon: string | undefined,
    request: KuzzleRequest,
  ): Promise<KDocument<AssetModelContent>> {
    return withMetadataReferentialLock(async () => {
      if (Inflector.pascalCase(model) !== model) {
        throw new BadRequestError(`Asset model "${model}" must be PascalCase.`);
      }

      const existingAsset = await this.getAsset(tenantClasses, index, model);

      this.checkReferentialOnly(
        "asset",
        model,
        metadataMappings,
        existingAsset._source,
      );

      const { fields: metadata, resolvedMappings } = await this.resolveMetadata(
        "asset",
        model,
        { defaultMetadata, metadataDetails, metadataMappings },
      );

      this.checkDefaultValues(resolvedMappings, metadata.defaultMetadata);

      const measuresUpdated =
        measures.length === 0 ? existingAsset._source.asset.measures : measures;

      // Preserve the existing scope: scope (tenantClasses / indexes) is decided
      // at write time and must not be silently rewritten by an update payload.
      // This also enforces tenantClasses / indexes mutual exclusivity (KZLPRD-1192).
      const assetModelContent: AssetModelContent = {
        asset: {
          ...metadata,
          icon: icon ?? existingAsset._source.asset.icon,
          locales,
          measures: measuresUpdated,
          metadataGroups,
          model,
          tooltipModels,
        },
        tenantClasses: existingAsset._source.tenantClasses,
        indexes: existingAsset._source.indexes,
        type: "asset",
      };
      const assetModel = {
        _id: existingAsset._id,
        _source: assetModelContent,
      };

      const conflicts = await ask<AskEngineUpdateConflict>(
        "ask:device-manager:engine:doesUpdateConflict",
        { twin: { models: [assetModelContent], type: "asset" } },
      );

      if (conflicts.length > 0) {
        throw new MappingsConflictsError(
          `Assets mappings are causing conflicts`,
          conflicts,
        );
      }

      // The field must be deleted if an element of the table is to be deleted.
      // ? Only after the conflicts check, so a rejected update leaves the model untouched
      await this.sdk.document.deleteFields(
        this.config.platformIndex,
        InternalCollection.MODELS,
        existingAsset._id,
        [
          "asset.tooltipModels",
          "asset.metadataMappings",
          "asset.defaultMetadata",
          "asset.metadataDetails",
          "asset.metadataGroups",
        ],
        { source: true },
      );

      const endDocument = await this.updateDocument<AssetModelContent>(
        request,
        assetModel,
        {
          collection: InternalCollection.MODELS,
          index: this.config.platformIndex,
        },
        { source: true },
      );

      // ? Only update indexes and refresh asset models when necessary
      if (
        Object.keys(metadata.metadataMappings).length > 0 ||
        measures.length > 0
      ) {
        await this.sdk.collection.refresh(
          this.config.platformIndex,
          InternalCollection.MODELS,
        );

        await this.updateEnginesOrRestore(
          existingAsset._id,
          existingAsset._source,
        );
        await ask<AskAssetRefreshModel>(
          "ask:device-manager:asset:refresh-model",
          {
            assetModel: endDocument._source,
          },
        );
      }

      return endDocument;
    });
  }

  /**
   * Adds metadata of the metadata referential to a device model.
   *
   * Device models are additive only from the API: every existing metadata must be kept unchanged,
   * new metadata must come from the referential. Metadata details and default values can change.
   * The engines mappings are updated and the devices get the new metadata with their default value.
   *
   * @throws BadRequestError if an existing metadata is missing or changed, or a new one is inline
   * @throws MappingsConflictsError if the new metadata conflict with the existing mappings
   */
  async updateDevice(
    model: string,
    { defaultMetadata, metadataDetails, metadataMappings }: DeviceModelUpdate,
  ): Promise<KDocument<DeviceModelContent>> {
    return withMetadataReferentialLock(async () => {
      const existingDevice = await this.getDevice(model);
      const existing = existingDevice._source.device;
      const existingMappings = existing.metadataMappings ?? {};

      const removed = Object.keys(existingMappings).filter(
        (name) => !isEqual(existingMappings[name], metadataMappings[name]),
      );

      if (removed.length > 0) {
        throw new BadRequestError(
          `Device model "${model}" metadata cannot be removed or modified: ${removed.join(", ")}`,
        );
      }

      const inline = Object.keys(metadataMappings).filter(
        (name) =>
          !(name in existingMappings) &&
          !isReferentialMapping(metadataMappings[name]),
      );

      if (inline.length > 0) {
        throw new BadRequestError(
          `New metadata of device model "${model}" must come from the metadata referential, inline metadata: ${inline.join(", ")}`,
        );
      }

      const { fields: metadata } = await this.resolveMetadata("device", model, {
        defaultMetadata: defaultMetadata ?? existing.defaultMetadata,
        metadataDetails: metadataDetails ?? existing.metadataDetails,
        metadataMappings,
      });

      const deviceModelContent: DeviceModelContent = {
        ...existingDevice._source,
        device: { ...existing, ...metadata },
      };

      const conflicts = await ask<AskEngineUpdateConflict>(
        "ask:device-manager:engine:doesUpdateConflict",
        { twin: { models: [deviceModelContent], type: "device" } },
      );

      if (conflicts.length > 0) {
        throw new MappingsConflictsError(
          `Devices mappings are causing conflicts`,
          conflicts,
        );
      }

      const deviceModel =
        await this.sdk.document.createOrReplace<DeviceModelContent>(
          this.config.platformIndex,
          InternalCollection.MODELS,
          existingDevice._id,
          deviceModelContent,
        );

      await this.sdk.collection.refresh(
        this.config.platformIndex,
        InternalCollection.MODELS,
      );
      await this.updateEnginesOrRestore(
        existingDevice._id,
        existingDevice._source,
      );
      await ask<AskDeviceRefreshModel>(
        "ask:device-manager:device:refresh-model",
        { deviceModel: deviceModel._source },
      );

      return deviceModel;
    });
  }

  /**
   * Returns the group model available for the given tenant classes:
   * a model of these classes first, then a commons model.
   *
   * @throws NotFoundError if no group model with this name is available
   */
  private async getScopedGroup(
    tenantClasses: string[],
    model: string,
  ): Promise<KDocument<GroupModelContent>> {
    const result = await this.sdk.document.search<GroupModelContent>(
      this.config.platformIndex,
      InternalCollection.MODELS,
      {
        query: {
          and: [
            { equals: { type: "group" } },
            { equals: { "group.model": model } },
          ],
        },
      },
      { lang: "koncorde", size: 100 },
    );

    const scoped = result.hits.find(({ _source }) =>
      _source.tenantClasses.some(
        (tenantClass) =>
          tenantClass !== "commons" && tenantClasses.includes(tenantClass),
      ),
    );
    const common = result.hits.find(({ _source }) =>
      _source.tenantClasses.includes("commons"),
    );
    const groupModel = scoped ?? common;

    if (!groupModel) {
      throw new NotFoundError(
        `Unknown Group model "${model}" for tenant classes "${tenantClasses.join(", ")}".`,
      );
    }

    return { _id: groupModel._id, _source: groupModel._source };
  }

  /**
   * Updates a group model, keeping its scope.
   * Affinity and icon are kept when omitted.
   *
   * The engines mappings are updated and the groups of the model are refreshed.
   *
   * @throws MappingsConflictsError if the new mappings conflict with the existing ones
   */
  async updateGroup(
    tenantClasses: string[],
    model: string,
    {
      affinity,
      defaultMetadata,
      icon,
      locales,
      metadataDetails,
      metadataGroups,
      metadataMappings,
    }: GroupModelUpdate,
  ): Promise<KDocument<GroupModelContent>> {
    return withMetadataReferentialLock(async () => {
      if (Inflector.pascalCase(model) !== model) {
        throw new BadRequestError(`Group model "${model}" must be PascalCase.`);
      }

      const existingGroup = await this.getScopedGroup(tenantClasses, model);
      const existing = existingGroup._source.group;

      this.checkReferentialOnly(
        "group",
        model,
        metadataMappings,
        existingGroup._source,
      );

      const { fields: metadata, resolvedMappings } = await this.resolveMetadata(
        "group",
        model,
        { defaultMetadata, metadataDetails, metadataMappings },
      );

      this.checkDefaultValues(resolvedMappings, metadata.defaultMetadata);

      const groupModelContent: GroupModelContent = {
        tenantClasses: existingGroup._source.tenantClasses,
        group: {
          ...metadata,
          affinity:
            affinity === undefined
              ? existing.affinity
              : this.checkGroupAffinity(affinity),
          icon: icon ?? existing.icon,
          locales,
          metadataGroups,
          model,
        },
        type: "group",
      };

      const conflicts = await ask<AskEngineUpdateConflict>(
        "ask:device-manager:engine:doesUpdateConflict",
        { groupModels: [groupModelContent] },
      );

      if (conflicts.length > 0) {
        throw new MappingsConflictsError(
          `Group mappings are causing conflicts`,
          conflicts,
        );
      }

      const groupModel =
        await this.sdk.document.createOrReplace<GroupModelContent>(
          this.config.platformIndex,
          InternalCollection.MODELS,
          existingGroup._id,
          groupModelContent,
        );

      await this.sdk.collection.refresh(
        this.config.platformIndex,
        InternalCollection.MODELS,
      );
      await this.updateEnginesOrRestore(
        existingGroup._id,
        existingGroup._source,
      );
      await ask<AskGroupRefreshModel>(
        "ask:device-manager:group:refresh-model",
        {
          groupModel: groupModel._source,
        },
      );

      return groupModel;
    });
  }

  /**
   * Validates the metadata of a model written through the API against the metadata referential
   * and enriches the details and default values of the metadata coming from it
   */
  private async resolveMetadata(
    modelType: MetadataModelType,
    model: string,
    fields: ModelMetadataFields,
  ): Promise<MetadataEnrichment> {
    const enrichment = enrichModelMetadata(
      await this.getMetadataReferential(),
      fields,
      {
        createError: (message) => new BadRequestError(message),
        model,
        modelType,
      },
    );

    for (const warning of enrichment.warnings) {
      this.logger.warn(warning);
    }

    return enrichment;
  }

  /**
   * Resolves the referential metadata of stored models, to be returned by the API
   */
  async resolveModels<D extends { _source: MetadataModelContent }>(
    documents: D[],
  ): Promise<D[]> {
    const referential = await this.getMetadataReferential();

    return documents.map((document) => ({
      ...document,
      _source: resolveModelMetadata(referential, document._source),
    }));
  }

  async getMetadataReferential(): Promise<MetadataReferential> {
    return fetchMetadataReferential(this.sdk, this.config.platformIndex);
  }

  /**
   * Creates a metadata of the metadata referential, or updates its details.
   *
   * The mappings of a new metadata are merged into the assets, devices and groups collections
   * of every engine. They cannot be modified afterwards: only the locales, editor hint,
   * default value and icon of an existing metadata can change. These are copied into the models
   * using the metadata when they are written, the existing models are not modified.
   *
   * @throws BadRequestError if the mappings of an existing metadata are modified
   * @throws MappingsConflictsError if the new metadata conflicts with an inline metadata of a model
   *  or with the actual mappings of an engine collection
   */
  async writeMetadata(
    name: string,
    definition: MetadataReferentialEntry,
  ): Promise<MetadataReferential> {
    checkMetadataReferentialEntry(
      name,
      definition,
      (message) => new BadRequestError(message),
    );

    return withMetadataReferentialLock(async () => {
      const stored = await this.getMetadataReferential();
      const entry: MetadataReferentialEntry = {
        locales: {},
        ...omit(definition, "managed"),
      };

      this.checkUnmanagedMetadata(stored, name);

      if (stored[name]) {
        if (!isEqual(stored[name].mappings, entry.mappings)) {
          throw new BadRequestError(
            `The mappings of metadata "${name}" cannot be modified, they are already merged into the engines collections`,
          );
        }

        const referential = { ...stored, [name]: entry };

        await saveMetadataReferential(
          this.sdk,
          this.config.platformIndex,
          referential,
        );

        return referential;
      }

      const models = await fetchMetadataModels(
        this.sdk,
        this.config.platformIndex,
      );
      const modelsConflicts = getEntryModelsConflicts(
        name,
        entry,
        models.map(({ _source }) => _source),
      );

      if (modelsConflicts.length > 0) {
        throw new MappingsConflictsError(
          `Metadata "${name}" conflicts with the metadata of models`,
          modelsConflicts,
        );
      }

      const esConflicts = await ask<AskEngineMetadataConflict>(
        "ask:device-manager:engine:doesMetadataConflict",
        { metadataMappings: { [name]: entry.mappings } },
      );

      if (esConflicts.length > 0) {
        throw new MappingsConflictsError(
          `Metadata "${name}" conflicts with the engines collections mappings`,
          esConflicts,
        );
      }

      const referential = { ...stored, [name]: entry };

      await saveMetadataReferential(
        this.sdk,
        this.config.platformIndex,
        referential,
      );

      try {
        await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");
      } catch (error) {
        // ? A metadata rejected by Elasticsearch would make every next engines update fail
        await saveMetadataReferential(
          this.sdk,
          this.config.platformIndex,
          stored,
        );

        throw error;
      }

      return referential;
    });
  }

  /**
   * Deletes a metadata of the metadata referential.
   * Its mappings stay in the engines collections, Elasticsearch cannot remove them.
   *
   * @throws BadRequestError if a model still uses the metadata
   */
  async deleteMetadata(name: string): Promise<MetadataReferential> {
    return withMetadataReferentialLock(async () => {
      const referential = await this.getMetadataReferential();

      if (!referential[name]) {
        throw new NotFoundError(
          `Unknown metadata "${name}" in the metadata referential`,
        );
      }

      this.checkUnmanagedMetadata(referential, name);

      const referencingModels = await fetchReferencingModels(
        this.sdk,
        this.config.platformIndex,
        name,
      );

      if (referencingModels.length > 0) {
        throw new BadRequestError(
          `Metadata "${name}" is still used by the models: ${referencingModels
            .map(({ _id }) => _id)
            .join(", ")}`,
        );
      }

      const updatedReferential = omit(referential, name);

      await saveMetadataReferential(
        this.sdk,
        this.config.platformIndex,
        updatedReferential,
      );

      return updatedReferential;
    });
  }

  /**
   * With the referentialOnly option, rejects the inline metadata a model write adds.
   * The inline metadata already defined by the stored model are kept (legacy).
   *
   * @throws BadRequestError if new inline metadata are added
   */
  private checkReferentialOnly(
    modelType: MetadataModelType,
    model: string,
    metadataMappings: MetadataMappings,
    stored: MetadataModelContent | null,
  ) {
    if (!this.config.models?.metadata?.referentialOnly) {
      return;
    }

    const added = getAddedInlineMetadata(metadataMappings, stored);

    if (added.length > 0) {
      throw new BadRequestError(
        `New metadata of ${modelType} model "${model}" must come from the metadata referential, inline metadata: ${added.join(", ")}`,
      );
    }
  }

  /**
   * Updates the engines collections. If Elasticsearch rejects the new mappings, the model is
   * restored to its previous version (or deleted if it is new), otherwise every next engines
   * update would fail on it.
   */
  private async updateEnginesOrRestore(
    _id: string,
    previous: ModelContent | null,
  ) {
    try {
      await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");
    } catch (error) {
      if (previous) {
        await this.sdk.document.createOrReplace(
          this.config.platformIndex,
          InternalCollection.MODELS,
          _id,
          omit(previous, "_kuzzle_info"),
          { refresh: "wait_for" },
        );
      } else {
        await this.sdk.document.delete(
          this.config.platformIndex,
          InternalCollection.MODELS,
          _id,
          { refresh: "wait_for" },
        );
      }

      throw error;
    }
  }

  private async getStoredModel<T extends ModelContent>(
    _id: string,
  ): Promise<T | null> {
    try {
      const { _source } = await this.sdk.document.get<T>(
        this.config.platformIndex,
        InternalCollection.MODELS,
        _id,
      );

      return _source;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * @throws BadRequestError if the metadata is registered from code
   */
  private checkUnmanagedMetadata(
    referential: MetadataReferential,
    name: string,
  ) {
    if (referential[name]?.managed) {
      throw new BadRequestError(
        `Metadata "${name}" is registered from code, it cannot be modified or deleted through the API`,
      );
    }
  }
}
