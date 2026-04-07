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
  ModelContent,
  TooltipModels,
} from "./types/ModelContent";
import {
  AskModelAssetGet,
  AskModelDeviceGet,
  AskModelGroupGet,
  AskModelMeasureGet,
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
import { KuzzleLogger } from "kuzzle-logger";

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
      async ({ engineGroups, engineId, model }) => {
        const assetModel = await this.getAsset(engineGroups, engineId, model);

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
    onAsk<AskModelMeasureGet>(
      "ask:device-manager:model:measure:get",
      async ({ type, engineId }) => {
        const measureModel = await this.getMeasure(type, engineId);

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
  async writeAsset(
    engineGroups: string[],
    model: string,
    metadataMappings: MetadataMappings,
    defaultMetadata: JSONObject,
    metadataDetails: MetadataDetails,
    metadataGroups: MetadataGroups,
    measures: NamedMeasures,
    tooltipModels: TooltipModels,
    locales: { [valueName: string]: LocaleDetails },
    engineIds?: string[],
  ): Promise<KDocument<AssetModelContent>> {
    if (Inflector.pascalCase(model) !== model) {
      throw new BadRequestError(`Asset model "${model}" must be PascalCase.`);
    }

    if (engineIds?.length && engineGroups?.length) {
      throw new BadRequestError(
        `"engineIds" and "engineGroups" are mutually exclusive on an asset model.`,
      );
    }

    const duplicates = getNamedMeasuresDuplicates(measures);

    if (duplicates.length > 0) {
      throw new MeasuresNamesDuplicatesError(
        "Asset model measures contain one or multiple duplicate measure name",
        duplicates,
      );
    }

    const normalizedEngineGroups = engineGroups.includes("commons")
      ? ["commons"]
      : engineGroups;

    // Anti-shadowing: reject if a model with the same name exists at a different scope level
    const isGlobal =
      normalizedEngineGroups.includes("commons") &&
      (!engineIds || engineIds.length === 0);
    const isTenantScoped = engineIds && engineIds.length > 0;
    const isGroupScoped = !isGlobal && !isTenantScoped;

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
      const docIsGlobal =
        doc.engineGroups?.includes("commons") &&
        (!doc.engineIds || doc.engineIds.length === 0);
      const docIsTenantScoped = doc.engineIds && doc.engineIds.length > 0;
      const docIsGroupScoped = !docIsGlobal && !docIsTenantScoped;

      // Same scope level: allow overwrite
      if (isGlobal && docIsGlobal) {
        continue;
      }
      if (isTenantScoped && docIsTenantScoped) {
        continue;
      }
      if (isGroupScoped && docIsGroupScoped) {
        continue;
      }

      // Different scope levels: reject
      if (docIsGlobal) {
        throw new BadRequestError(
          `Asset model "${model}" already exists as a global (commons) model. A model cannot exist at multiple scopes.`,
        );
      }
      if (isGlobal) {
        throw new BadRequestError(
          `Asset model "${model}" already exists at a non-global scope. A model cannot exist at multiple scopes.`,
        );
      }
      if (isTenantScoped && docIsGroupScoped) {
        throw new BadRequestError(
          `Asset model "${model}" already exists at group scope. A model cannot be both group-scoped and tenant-scoped.`,
        );
      }
      if (isGroupScoped && docIsTenantScoped) {
        throw new BadRequestError(
          `Asset model "${model}" already exists at tenant scope. A model cannot be both group-scoped and tenant-scoped.`,
        );
      }
    }

    const modelContent: AssetModelContent = {
      asset: {
        defaultMetadata,
        locales,
        measures,
        metadataDetails,
        metadataGroups,
        metadataMappings,
        model,
        tooltipModels,
      },
      ...(engineIds?.length
        ? { engineIds }
        : { engineGroups: normalizedEngineGroups }),
      type: "asset",
    } as AssetModelContent;

    this.checkDefaultValues(metadataMappings, defaultMetadata);

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
    await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");

    await ask<AskAssetRefreshModel>("ask:device-manager:asset:refresh-model", {
      assetModel: assetModel._source,
    });

    return assetModel;
  }

  async writeDevice(
    model: string,
    metadataMappings: MetadataMappings,
    defaultMetadata: JSONObject,
    metadataDetails: MetadataDetails,
    metadataGroups: MetadataGroups,
    measures: NamedMeasures,
  ): Promise<KDocument<DeviceModelContent>> {
    if (Inflector.pascalCase(model) !== model) {
      throw new BadRequestError(`Device model "${model}" must be PascalCase.`);
    }

    const duplicates = getNamedMeasuresDuplicates(measures);

    if (duplicates.length > 0) {
      throw new MeasuresNamesDuplicatesError(
        "Device model measures contain one or multiple duplicate measure name",
        duplicates,
      );
    }

    const modelContent: DeviceModelContent = {
      device: {
        defaultMetadata,
        measures,
        metadataDetails,
        metadataGroups,
        metadataMappings,
        model,
      },
      type: "device",
    };

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
    await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");

    await ask<AskDeviceRefreshModel>(
      "ask:device-manager:device:refresh-model",
      {
        deviceModel: modelContent,
      },
    );

    return deviceModel;
  }

  async writeGroup(
    engineGroups: string[],
    model: string,
    affinity: JSONObject,
    metadataMappings: MetadataMappings,
    defaultMetadata: JSONObject,
    metadataDetails: MetadataDetails,
    metadataGroups: MetadataGroups,
  ): Promise<KDocument<GroupModelContent>> {
    if (Inflector.pascalCase(model) !== model) {
      throw new BadRequestError(`Group model "${model}" must be PascalCase.`);
    }
    if (engineGroups.includes("commons")) {
      engineGroups = ["commons"];
    }

    const groupAffinity = this.checkGroupAffinity(affinity);
    const modelContent: GroupModelContent = {
      engineGroups,
      group: {
        affinity: groupAffinity,
        defaultMetadata,
        metadataDetails,
        metadataGroups,
        metadataMappings,
        model,
      },
      type: "group",
    };

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
    await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");

    return groupModel;
  }

  async writeMeasure(
    type: string,
    valuesMappings: JSONObject,
    validationSchema?: SchemaObject,
    valuesDetails?: MeasureValuesDetails,
    locales?: {
      [valueName: string]: LocaleDetails;
    },
    engineIds?: string[],
  ): Promise<KDocument<MeasureModelContent>> {
    const modelContent: MeasureModelContent = {
      measure: {
        locales,
        type,
        valuesDetails,
        valuesMappings,
      },
      type: "measure",
    };

    if (engineIds?.length) {
      modelContent.engineIds = engineIds;
    }

    // Anti-shadowing: a measure type must be either global or tenant-scoped, not both
    await this.checkMeasureShadowing(type, engineIds);

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

    const measureModel =
      await this.sdk.document.createOrReplace<MeasureModelContent>(
        this.config.platformIndex,
        InternalCollection.MODELS,
        ModelSerializer.id<MeasureModelContent>("measure", modelContent),
        modelContent,
      );

    await this.sdk.collection.refresh(
      this.config.platformIndex,
      InternalCollection.MODELS,
    );
    await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");

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
   * List all asset models regardless of engine group scope.
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
  async engineExists(engineId: string): Promise<boolean> {
    try {
      const result = await this.sdk.document.search(
        this.config.platformIndex,
        InternalCollection.CONFIG,
        {
          query: {
            bool: {
              must: [
                { term: { type: "engine-device-manager" } },
                { term: { "engine.index": engineId } },
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
   * Check if the requesting user has access to an engine.
   */
  async userHasEngineAccess(
    request: KuzzleRequest,
    engineId: string,
  ): Promise<boolean> {
    try {
      const result = await this.sdk.query({
        controller: "auth",
        action: "checkRights",
        body: {
          controller: "device-manager/assets",
          action: "get",
          index: engineId,
        },
        jwt: request.context.token?.jwt,
      });
      return (result.result as { allowed: boolean }).allowed;
    } catch {
      return false;
    }
  }

  /**
   * Find engine groups that don't exist.
   */
  async findInvalidEngineGroups(engineGroups: string[]): Promise<string[]> {
    // "commons" is always valid
    const toCheck = engineGroups.filter((g) => g !== "commons");
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

    const existingGroups = new Set(
      result.hits.map(
        (h) => (h._source as { engine?: { group?: string } }).engine?.group,
      ),
    );

    return toCheck.filter((g) => !existingGroups.has(g));
  }

  async listAsset(
    engineGroups: string[],
    engineId?: string,
  ): Promise<KDocument<AssetModelContent>[]> {
    const result = await this.searchAssets(engineGroups, engineId, {
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
    engineGroups: string[],
  ): Promise<KDocument<GroupModelContent>[]> {
    const result = await this.searchGroups(engineGroups, {
      searchBody: {
        sort: { "group.model": "asc" },
      },
      size: 5000,
    });

    return result.hits;
  }

  async listMeasures(
    engineId?: string,
  ): Promise<KDocument<MeasureModelContent>[]> {
    const result = await this.searchMeasures(engineId, {
      searchBody: {
        sort: { "measure.type": "asc" },
      },
      size: 5000,
    });

    return result.hits;
  }

  async searchAssets(
    engineGroups: string[],
    engineId: string | undefined,
    searchParams: Partial<SearchParams>,
  ): Promise<SearchResult<KHit<AssetModelContent>>> {
    const scopeFilter = engineId
      ? {
          bool: {
            should: [
              {
                bool: {
                  must: [
                    { term: { engineIds: engineId } },
                    { terms: { engineGroups } },
                  ],
                },
              },
              {
                bool: {
                  must: [{ terms: { engineGroups } }],
                  must_not: [{ exists: { field: "engineIds" } }],
                },
              },
              {
                bool: {
                  must: [{ term: { engineGroups: "commons" } }],
                  must_not: [{ exists: { field: "engineIds" } }],
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
                  must: [{ terms: { engineGroups } }],
                  must_not: [{ exists: { field: "engineIds" } }],
                },
              },
              {
                bool: {
                  must: [{ term: { engineGroups: "commons" } }],
                  must_not: [{ exists: { field: "engineIds" } }],
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

  async searchDevices(
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

  async searchGroups(
    engineGroups: string[],
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
                { terms: { engineGroups } },
                { term: { engineGroups: "commons" } },
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

  async searchMeasures(
    engineId: string | undefined,
    searchParams: Partial<SearchParams>,
  ): Promise<SearchResult<KHit<MeasureModelContent>>> {
    const scopeFilter = engineId
      ? {
          bool: {
            should: [
              { term: { engineIds: engineId } },
              { bool: { must_not: [{ exists: { field: "engineIds" } }] } },
            ],
          },
        }
      : {
          bool: {
            must_not: [{ exists: { field: "engineIds" } }],
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
    engineGroups: string[],
    engineId: string | undefined,
    model: string,
  ): Promise<KDocument<AssetModelContent>> {
    const baseFilter = [
      { term: { type: "asset" } },
      { term: { "asset.model": model } },
    ];

    // Priority 1: tenant-scoped model for this specific engine
    if (engineId) {
      const tenantQuery = {
        bool: {
          must: [
            ...baseFilter,
            { terms: { engineGroups } },
            { term: { engineIds: engineId } },
          ],
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

    // Priority 2: group-scoped model (no engineIds field)
    const groupQuery = {
      bool: {
        must: [...baseFilter, { terms: { engineGroups } }],
        must_not: [{ exists: { field: "engineIds" } }],
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
        must: [...baseFilter, { term: { engineGroups: "commons" } }],
        must_not: [{ exists: { field: "engineIds" } }],
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
      `Unknown Asset model "${model}" for engineGroups ${engineGroups.join(", ")}.`,
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
    engineId?: string,
  ): Promise<KDocument<MeasureModelContent>> {
    const baseFilter = [
      { term: { type: "measure" } },
      { term: { "measure.type": type } },
    ];

    const scopeFilter = engineId
      ? {
          bool: {
            should: [
              { term: { engineIds: engineId } },
              { bool: { must_not: [{ exists: { field: "engineIds" } }] } },
            ],
          },
        }
      : {
          bool: {
            must_not: [{ exists: { field: "engineIds" } }],
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
    engineIds?: string[],
  ): Promise<void> {
    const isNewTenantScoped = engineIds && engineIds.length > 0;

    // Check for existing measures of the same type at the opposite scope
    const conflictQuery = isNewTenantScoped
      ? {
          // New is tenant-scoped → reject if a global measure exists
          bool: {
            must: [
              { term: { type: "measure" } },
              { term: { "measure.type": type } },
            ],
            must_not: [{ exists: { field: "engineIds" } }],
          },
        }
      : {
          // New is global → reject if any tenant-scoped measure exists
          bool: {
            must: [
              { term: { type: "measure" } },
              { term: { "measure.type": type } },
              { exists: { field: "engineIds" } },
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
    engineGroups: string[],
    engineId: string | undefined,
    model: string,
    metadataMappings: MetadataMappings,
    defaultMetadata: JSONObject,
    metadataDetails: MetadataDetails,
    metadataGroups: MetadataGroups,
    measures: AssetModelContent["asset"]["measures"],
    tooltipModels: TooltipModels,
    locales: { [valueName: string]: LocaleDetails },
    request: KuzzleRequest,
  ): Promise<KDocument<AssetModelContent>> {
    if (Inflector.pascalCase(model) !== model) {
      throw new BadRequestError(`Asset model "${model}" must be PascalCase.`);
    }

    this.checkDefaultValues(metadataMappings, defaultMetadata);

    const existingAsset = await this.getAsset(engineGroups, engineId, model);

    // The field must be deleted if an element of the table is to be deleted
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

    const measuresUpdated =
      measures.length === 0 ? existingAsset._source.asset.measures : measures;

    // Preserve the existing scope: scope (engineGroups / engineIds) is decided
    // at write time and must not be silently rewritten by an update payload.
    // This also enforces engineGroups / engineIds mutual exclusivity (KZLPRD-1192).
    const assetModelContent: AssetModelContent = {
      asset: {
        defaultMetadata,
        locales,
        measures: measuresUpdated,
        metadataDetails,
        metadataGroups,
        metadataMappings,
        model,
        tooltipModels,
      },
      engineGroups: existingAsset._source.engineGroups,
      engineIds: existingAsset._source.engineIds,
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

    const endDocument = await this.updateDocument<AssetModelContent>(
      request,
      assetModel,
      {
        collection: InternalCollection.MODELS,
        engineId: this.config.platformIndex,
      },
      { source: true },
    );

    // ? Only update engineIds and refresh asset models when necessary
    if (Object.keys(metadataMappings).length > 0 || measures.length > 0) {
      await this.sdk.collection.refresh(
        this.config.platformIndex,
        InternalCollection.MODELS,
      );

      await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");
      await ask<AskAssetRefreshModel>(
        "ask:device-manager:asset:refresh-model",
        {
          assetModel: endDocument._source,
        },
      );
    }

    return endDocument;
  }
}
