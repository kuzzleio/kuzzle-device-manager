import {
  Backend,
  CollectionMappings,
  InternalError,
  KDocumentContent,
  KDocumentContentGeneric,
  Plugin,
} from "kuzzle";
import {
  AbstractEngine,
  ConfigManager,
  EngineContent,
  onAsk,
} from "kuzzle-plugin-commons";
import { JSONObject } from "kuzzle-sdk";
import mapValues from "lodash/mapValues";
import merge from "lodash/merge";

import { assetsHistoryMappings } from "../asset";
import { NamedMeasures } from "../decoder";
import { measuresMappings } from "../measure";
import {
  AssetModelContent,
  DeviceModelContent,
  GroupModelContent,
  MeasureModelContent,
} from "../model";

import { DeviceManagerPlugin } from "./DeviceManagerPlugin";
import { DeviceManagerConfiguration } from "./types/DeviceManagerConfiguration";
import { InternalCollection } from "./types/InternalCollection";
import {
  ConflictChunk,
  findMappingsConflicts,
  getGroupConflicts,
  getMeasureConflicts,
  getTwinConflicts,
} from "../model/ModelsConflicts";
import {
  fetchMetadataReferential,
  resolveMetadataMappings,
  resolveModelMappings,
} from "../model/MetadataReferential";
import {
  MetadataMappings,
  MetadataReferential,
} from "../model/types/ModelContent";
import { addSchemaToCache } from "../shared/utils/AJValidator";
import { devicesPlatformMappings } from "../device";

export type TwinType = "asset" | "device";

export type TwinModelContent = AssetModelContent | DeviceModelContent;

export interface EngineDocument extends KDocumentContent {
  type: "engine-device-manager";
  engine: {
    // The tenant class. Named `group` by kuzzle-plugin-commons, which owns the
    // engine documents and the `engine:create` and `engine:update` API.
    group: string;
    index: string;
    name: string;
  };
}

export type AskEngineList = {
  name: "ask:device-manager:engine:list";

  payload: {
    tenantClass?: string;
  };

  result: EngineContent[];
};

export type AskEngineUpdateAll = {
  name: "ask:device-manager:engine:updateAll";

  payload: void;

  result: void;
};

export type AskEngineUpdateConflict = {
  name: "ask:device-manager:engine:doesUpdateConflict";

  payload: {
    twin?: {
      type: TwinType;
      models: TwinModelContent[];
    };
    measuresModels?: MeasureModelContent[];
    groupModels?: GroupModelContent[];
  };

  result: ConflictChunk[];
};

/**
 * Checks a metadata of the metadata referential against the actual metadata mappings
 * of the assets, devices and groups collections of every engine
 */
export type AskEngineMetadataConflict = {
  name: "ask:device-manager:engine:doesMetadataConflict";

  payload: {
    metadataMappings: MetadataMappings;
  };

  result: ConflictChunk[];
};

const METADATA_COLLECTIONS = {
  asset: InternalCollection.ASSETS,
  device: InternalCollection.DEVICES,
  group: InternalCollection.GROUPS,
};

function isModelApplicableToEngine(
  model: AssetModelContent,
  engineIndex: string,
  tenantClass: string,
): boolean {
  if (model.indexes?.length) {
    return model.indexes.includes(engineIndex);
  }

  // Class-scoped or commons: applicable to all engines of the class
  return (
    !model.tenantClasses?.length ||
    model.tenantClasses.includes(tenantClass) ||
    model.tenantClasses.includes("commons")
  );
}

export class DeviceManagerEngine extends AbstractEngine<DeviceManagerPlugin> {
  public config: DeviceManagerConfiguration;

  get app(): Backend {
    return global.app;
  }

  constructor(
    plugin: Plugin,
    platformConfigManager: ConfigManager,
    engineConfigManager: ConfigManager,
  ) {
    super(
      "device-manager",
      plugin,
      plugin.config.platformIndex,
      platformConfigManager,
      engineConfigManager,
    );

    this.context = plugin.context;

    onAsk<AskEngineList>("ask:device-manager:engine:list", ({ tenantClass }) =>
      this.list(tenantClass),
    );

    onAsk<AskEngineUpdateAll>(
      "ask:device-manager:engine:updateAll",
      async () => {
        await this.updateEngines();
        await this.updateMeasuresSchema();
        await this.createPlatformDevicesCollection();
      },
    );

    onAsk<AskEngineUpdateConflict>(
      "ask:device-manager:engine:doesUpdateConflict",
      async (payload) => {
        if (!payload) {
          return [];
        }

        if (
          payload.twin === undefined &&
          payload.measuresModels === undefined &&
          payload.groupModels === undefined
        ) {
          return [];
        }

        const measureModels = await this.getModels<MeasureModelContent>(
          this.config.platformIndex,
          "measure",
        );

        // ? Models mark the metadata of the referential, conflicts are checked on the actual mappings
        const referential = await fetchMetadataReferential(
          this.sdk,
          this.config.platformIndex,
        );

        const engines = await this.getEngines();

        if (payload.twin) {
          const conflicts = await this.getTwinUpdateConflicts(
            payload.twin,
            referential,
            measureModels,
            engines,
          );

          if (conflicts.length > 0) {
            return conflicts;
          }
        }

        if (payload.measuresModels) {
          return this.doesMeasuresUpdateConflicts(
            measureModels,
            payload.measuresModels,
          );
        }
        if (payload.groupModels) {
          return this.getGroupsUpdateConflicts(
            payload.groupModels,
            referential,
            engines,
          );
        }

        return [];
      },
    );

    onAsk<AskEngineMetadataConflict>(
      "ask:device-manager:engine:doesMetadataConflict",
      async ({ metadataMappings }) => {
        const engines = await this.getEngines();
        const targets = engines.flatMap(({ engine }) =>
          Object.values(METADATA_COLLECTIONS).map((collection) => ({
            collection,
            index: engine.index,
          })),
        );

        const chunks = await Promise.all(
          targets.map(
            async ({ index, collection }): Promise<ConflictChunk | null> => {
              const esConflicts = findMappingsConflicts(
                await this.getCollectionMetadataMappings(index, collection),
                metadataMappings,
                `${collection}.metadata`,
              );

              if (esConflicts.length === 0) {
                return null;
              }

              return {
                conflicts: esConflicts,
                modelType: "metadata",
                newModel: "metadata-referential",
                sourceModel: `${index}/${collection}`,
              };
            },
          ),
        );

        return chunks.filter((chunk) => chunk !== null);
      },
    );
  }

  private resolveModels<T extends TwinModelContent | GroupModelContent>(
    referential: MetadataReferential,
    models: T[],
  ): T[] {
    return models.map((model) => resolveModelMappings(referential, model));
  }

  /**
   * Return conflicts of new twin models, first against the platform models,
   * then against the models and the actual mappings of every engine
   */
  private async getTwinUpdateConflicts(
    twin: AskEngineUpdateConflict["payload"]["twin"],
    referential: MetadataReferential,
    measureModels: MeasureModelContent[],
    engines: EngineDocument[],
  ): Promise<ConflictChunk[]> {
    const newTwinModels = this.resolveModels(referential, twin.models);

    // Platform-level check (no tenant class filter)
    const twinModels = this.resolveModels(
      referential,
      await this.getModels<TwinModelContent>(
        this.config.platformIndex,
        twin.type,
      ),
    );

    // Platform-level twins can only reference global measures
    const globalMeasures = measureModels.filter((m) => !m.indexes?.length);

    const conflicts = this.doesTwinUpdateConflicts(
      twin.type,
      twinModels,
      newTwinModels,
      globalMeasures,
    );

    if (conflicts.length > 0) {
      return conflicts;
    }

    const tenantClasses = new Set(engines.map((elt) => elt.engine.group));

    for (const tenantClass of tenantClasses) {
      if (tenantClass === undefined) {
        continue;
      }

      // Per-engine check: each engine has its own ES index,
      // so conflicts are only relevant within the same engine's model set
      for (const engineDoc of engines.filter(
        (e) => e.engine.group === tenantClass,
      )) {
        const engineConflicts = await this.getEngineTwinConflicts(
          engineDoc.engine.index,
          tenantClass,
          twin.type,
          newTwinModels,
          measureModels,
          referential,
        );

        if (engineConflicts.length > 0) {
          return engineConflicts;
        }
      }
    }

    return [];
  }

  /**
   * Return conflicts of new twin models applicable to an engine, against the engine
   * models and the actual mappings of its collection
   */
  private async getEngineTwinConflicts(
    engineIndex: string,
    tenantClass: string,
    twinType: TwinType,
    newTwinModels: TwinModelContent[],
    measureModels: MeasureModelContent[],
    referential: MetadataReferential,
  ): Promise<ConflictChunk[]> {
    const twinModels = this.resolveModels(
      referential,
      await this.getModels<TwinModelContent>(
        this.config.platformIndex,
        twinType,
        tenantClass,
        engineIndex,
      ),
    );

    // Only check new models that will be applied to this engine
    const applicableNewModels = newTwinModels.filter((model) =>
      isModelApplicableToEngine(
        model as AssetModelContent,
        engineIndex,
        tenantClass,
      ),
    );

    if (applicableNewModels.length === 0) {
      return [];
    }

    // Per-engine: global measures + tenant-scoped for this engine
    const engineMeasures = measureModels.filter(
      (m) => !m.indexes?.length || m.indexes.includes(engineIndex),
    );

    const conflicts = this.doesTwinUpdateConflicts(
      twinType,
      twinModels,
      applicableNewModels,
      engineMeasures,
    );

    if (conflicts.length > 0) {
      return conflicts;
    }

    // ? Mappings of deleted models or removed metadata are still in the collection
    return this.getModelsMetadataConflicts(
      engineIndex,
      twinType,
      applicableNewModels,
    );
  }

  /**
   * Return conflicts of new group models, against the platform group models
   * then against the actual mappings of every engine groups collection
   */
  private async getGroupsUpdateConflicts(
    groupModels: GroupModelContent[],
    referential: MetadataReferential,
    engines: EngineDocument[],
  ): Promise<ConflictChunk[]> {
    const currentGroupModels = this.resolveModels(
      referential,
      await this.getModels<GroupModelContent>(
        this.config.platformIndex,
        "group",
      ),
    );
    const newGroupModels = this.resolveModels(referential, groupModels);
    const conflicts = this.doesGroupsUpdateConflicts(
      currentGroupModels,
      newGroupModels,
    );

    if (conflicts.length > 0) {
      return conflicts;
    }

    // ? Every engine groups collection has the mappings of every group model
    for (const { engine } of engines) {
      const esConflicts = await this.getModelsMetadataConflicts(
        engine.index,
        "group",
        newGroupModels,
      );

      if (esConflicts.length > 0) {
        return esConflicts;
      }
    }

    return [];
  }

  /**
   * Returns the actual metadata mappings of an engine collection
   *
   * @returns The mappings of the metadata properties, empty if the collection does not exist
   */
  private async getCollectionMetadataMappings(
    engineIndex: string,
    collection: string,
  ): Promise<JSONObject> {
    try {
      const mappings: JSONObject = await this.sdk.collection.getMapping(
        engineIndex,
        collection,
      );

      return mappings.properties?.metadata?.properties ?? {};
    } catch (error) {
      if (error.status === 404) {
        return {};
      }

      throw error;
    }
  }

  /**
   * Return conflicts between the metadata mappings of models and the actual mappings
   * of their collection in an engine
   *
   * @param engineIndex The target engine
   * @param modelType The models type
   * @param models The new or updated models, with their referential metadata resolved
   * @returns An array of ConflictChunk
   */
  private async getModelsMetadataConflicts(
    engineIndex: string,
    modelType: keyof typeof METADATA_COLLECTIONS,
    models: Array<TwinModelContent | GroupModelContent>,
  ): Promise<ConflictChunk[]> {
    const collection = METADATA_COLLECTIONS[modelType];
    const metadataMappings = await this.getCollectionMetadataMappings(
      engineIndex,
      collection,
    );
    const chunks: ConflictChunk[] = [];

    for (const model of models) {
      const conflicts = findMappingsConflicts(
        metadataMappings,
        model[modelType].metadataMappings,
        `${modelType}.metadataMappings`,
      );

      if (conflicts.length > 0) {
        chunks.push({
          conflicts,
          modelType,
          newModel: model[modelType].model,
          sourceModel: `${engineIndex}/${collection}`,
        });
      }
    }

    return chunks;
  }

  /**
   * Merges the mappings of the metadata referential and of models into metadata mappings.
   * Every referential metadata is merged, used by a model or not.
   */
  private mergeMetadataMappings(
    metadataProperties: JSONObject,
    referential: MetadataReferential,
    modelsMappings: MetadataMappings[],
  ) {
    merge(
      metadataProperties,
      mapValues(referential, (entry) => structuredClone(entry.mappings)),
    );

    for (const metadataMappings of modelsMappings) {
      merge(
        metadataProperties,
        resolveMetadataMappings(referential, metadataMappings),
      );
    }
  }

  /**
   * Return conflicts between the new and already present twin models
   *
   * @param twinType The target twin type
   * @param twinModels The already present twin models
   * @param additionalModels The new or updated twin models
   * @param measureModels The already present measures models
   *
   * @throws If a measure type declared in the twin does not exists
   * @returns An array of conflict chunk
   */
  private doesTwinUpdateConflicts(
    twinType: TwinType,
    twinModels: TwinModelContent[],
    additionalModels: TwinModelContent[],
    measureModels: MeasureModelContent[],
  ): ConflictChunk[] {
    const conflicts: ConflictChunk[] = [];

    for (const additional of additionalModels) {
      for (const { type: measureType } of additional[twinType]
        .measures as NamedMeasures) {
        if (!measureModels.some((m) => m.measure.type === measureType)) {
          throw new InternalError(
            `Cannot find measure "${measureType}" declared in ${[
              twinType,
            ]} "${additional[twinType].model}"`,
          );
        }
      }

      conflicts.push(...getTwinConflicts(twinType, twinModels, additional));
    }

    return conflicts;
  }

  /**
   * Return conflicts between the new and already present group models
   *
   * @param groupModels The already present group models
   * @param additionalGroups The new or updated group models
   * @returns An array of ConflictChunk
   */
  private doesGroupsUpdateConflicts(
    groupModels: GroupModelContent[],
    additionalGroups: GroupModelContent[],
  ): ConflictChunk[] {
    const conflicts: ConflictChunk[] = [];

    for (const model of additionalGroups) {
      conflicts.push(...getGroupConflicts(groupModels, model));
    }

    return conflicts;
  }

  /**
   * Return conflicts between the new and already present measure models
   *
   * @param measuresModels The already present measure models
   * @param additionalMeasures The new or updated measure models
   * @returns An array of ConflictChunk
   */
  private doesMeasuresUpdateConflicts(
    measuresModels: MeasureModelContent[],
    additionalMeasures: MeasureModelContent[],
  ): ConflictChunk[] {
    const conflicts: ConflictChunk[] = [];

    for (const model of additionalMeasures) {
      conflicts.push(...getMeasureConflicts(measuresModels, model));
    }

    return conflicts;
  }

  async updateEngines() {
    const results = await this.getEngines();

    this.context.log.info(`Update ${results.length} existing engines`);

    for (const document of results) {
      await this.onUpdate(document.engine.index, document.engine.group); // NOSONAR: engines are updated one at a time to avoid overloading ES with mapping updates
    }
  }

  /**
   * Search and return every engines in use
   *
   * @returns An array of the available engines
   */
  async getEngines(): Promise<EngineDocument[]> {
    const result = await this.sdk.document.search<EngineDocument>(
      this.config.platformIndex,
      InternalCollection.CONFIG,
      {
        query: {
          equals: { type: "engine-device-manager" },
        },
      },
      { lang: "koncorde", size: 5000 },
    );

    return result.hits.map((elt) => elt._source);
  }

  async updateMeasuresSchema() {
    const models = await this.getModels<MeasureModelContent>(
      this.config.platformIndex,
      "measure",
    );

    for (const measure of models) {
      const { validationSchema } = measure.measure;
      if (validationSchema) {
        try {
          addSchemaToCache(measure.measure.type, validationSchema);
        } catch (error) {
          this.app.log.error(
            `The validation schema for the "${measure.type}" measure model does not comply with the JSON Schema standard, so its update has been skipped`,
          );
        }
      }
    }
  }

  async onCreate(index: string, tenantClass = "commons") {
    const promises = [
      this.createAssetsCollection(index, tenantClass),
      this.createAssetsHistoryCollection(index, tenantClass),
      this.createGroupsCollection(index),
      this.createDevicesCollection(index),
      this.createMeasuresCollection(index, tenantClass),
    ];

    const collections = await Promise.all(promises);

    return {
      collections: [this.engineConfigManager.collection, ...collections],
    };
  }

  async onUpdate(index: string, tenantClass = "commons") {
    const promises = [
      this.createAssetsCollection(index, tenantClass),
      this.createAssetsHistoryCollection(index, tenantClass),
      this.createGroupsCollection(index),
      this.createDevicesCollection(index),
      this.createMeasuresCollection(index, tenantClass),
    ];

    const collections = await Promise.all(promises);

    return { collections };
  }

  async onDelete(index: string) {
    const collections = [
      InternalCollection.ASSETS,
      InternalCollection.ASSETS_HISTORY,
      InternalCollection.GROUPS,
      InternalCollection.DEVICES,
      InternalCollection.MEASURES,
    ];
    await Promise.all(
      collections.map(async (collection) => {
        if (await this.sdk.collection.exists(index, collection)) {
          await this.sdk.collection.delete(index, collection);
        }
      }),
    );
    await this.detachDevicesFromPlatformIndex(index);
    return {
      collections,
    };
  }

  /**
   * Generate assets mappings and create the assets collection in the engine
   *
   * @param index The target engine Id
   * @param tenantClass The tenant class
   *
   * @throws If it failed during the assets collection creation
   */
  async createAssetsCollection(index: string, tenantClass: string) {
    const mappings = await this.getDigitalTwinMappingsFromDB<AssetModelContent>(
      "asset",
      tenantClass,
      index,
    );
    const settings = this.config.engineCollections.assets.settings;

    await this.tryCreateCollection(index, InternalCollection.ASSETS, {
      mappings,
      settings,
    });

    return InternalCollection.ASSETS;
  }

  /**
   * Generate assets mappings and create the assets history collection in the engine
   *
   * @param index The target engine Id
   * @param tenantClass The tenant class
   *
   * @throws If it failed during the assets history collection creation
   */
  async createAssetsHistoryCollection(index: string, tenantClass: string) {
    const assetsMappings =
      await this.getDigitalTwinMappingsFromDB<AssetModelContent>(
        "asset",
        tenantClass,
        index,
      );

    const mappings = structuredClone(assetsHistoryMappings) as JSONObject;

    merge(mappings.properties.asset, assetsMappings);

    const settings = this.config.engineCollections.assetHistory.settings;

    await this.tryCreateCollection(index, InternalCollection.ASSETS_HISTORY, {
      mappings,
      settings,
    });

    return InternalCollection.ASSETS_HISTORY;
  }

  /**
   * Create the groups collection with the groups mappings in the engine
   *
   * @param index The target engine Id
   * @param tenantClass The tenant class
   *
   * @throws If it failed during the groups collection creation
   */
  async createGroupsCollection(index: string) {
    const settings = this.config.engineCollections.groups.settings;
    const mappings = await this.getAssetGroupsMappingFromDB();
    await this.tryCreateCollection(index, InternalCollection.GROUPS, {
      mappings: mappings,
      settings,
    });

    return InternalCollection.GROUPS;
  }

  /**
   * Generate devices mappings and create the devices collection in the engine
   *
   * @param index The target engine Id
   * @param tenantClass The tenant class
   *
   * @throws If it failed during the devices collection creation
   */
  async createDevicesCollection(index: string) {
    const mappings =
      await this.getDigitalTwinMappingsFromDB<DeviceModelContent>("device");
    const settings = this.config.engineCollections.devices.settings;

    await this.tryCreateCollection(index, InternalCollection.DEVICES, {
      mappings,
      settings,
    });

    return InternalCollection.DEVICES;
  }
  /**
   * Generate devices mappings and create the devices collection in the engine
   *
   * @param index The target engine Id
   * @param tenantClass The tenant class
   *
   * @throws If it failed during the devices collection creation
   */
  async createPlatformDevicesCollection() {
    const settings = this.config.engineCollections.devices.settings;
    const enrichedMappings: any = { ...devicesPlatformMappings };
    const enrichedMeasureMappings = await this.getMeasuresMappingsFromDB(
      this.config.platformIndex,
    );
    enrichedMappings.properties.lastMeasures.properties.values.properties =
      enrichedMeasureMappings.properties.values.properties;
    await this.tryCreateCollection(
      this.config.platformIndex,
      InternalCollection.DEVICES,
      {
        mappings: devicesPlatformMappings,
        settings,
      },
    );

    return InternalCollection.DEVICES;
  }
  /**
   * Generate measures mappings and create the measures collection in the engine
   *
   * @param index The target engine Id
   * @param tenantClass The tenant class
   *
   * @throws If it failed during the measures collection creation
   */
  async createMeasuresCollection(index: string, tenantClass: string) {
    const mappings = await this.getMeasuresMappingsFromDB(tenantClass, index);
    const settings = this.config.engineCollections.measures.settings;

    await this.tryCreateCollection(index, InternalCollection.MEASURES, {
      mappings,
      settings,
    });

    return InternalCollection.MEASURES;
  }

  /**
   * Create a collection with custom mappings in an engine
   *
   * @param engineIndex The target engine
   * @param collection The collection name
   * @param mappings The collection mappings
   *
   * @throws If it failed to create the collection
   */
  private async tryCreateCollection(
    engineIndex: string,
    collection: string,
    options:
      | CollectionMappings
      | {
          mappings?: CollectionMappings;
          settings?: JSONObject;
        },
  ) {
    try {
      await this.sdk.collection.create(engineIndex, collection, options);
    } catch (error) {
      throw new InternalError(
        `Failed to create the collection [${collection}] for engine [${engineIndex}]: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Generate ES mappings from twin models and theirs associated measures, all fetched from the database
   *
   * @param digitalTwinType The target twin type
   * @param tenantClass The twin tenant class
   * @returns The complete ES mappings produces by merging all the target type twins
   */
  private async getDigitalTwinMappingsFromDB<
    TDigitalTwin extends TwinModelContent,
  >(digitalTwinType: TwinType, tenantClass?: string, targetIndex?: string) {
    const models = await this.getModels<TDigitalTwin>(
      this.config.platformIndex,
      digitalTwinType,
      tenantClass,
      targetIndex,
    );

    const measureModels = await this.getModels<MeasureModelContent>(
      this.config.platformIndex,
      "measure",
    );

    return this.getDigitalTwinMappings<TDigitalTwin>(
      digitalTwinType,
      models,
      measureModels,
    );
  }

  /**
   * Generate ES mappings from twin models and theirs associated measures
   *
   * @param digitalTwinType The target twin type
   * @param models The twin models
   * @param measureModels The associated measures
   * @returns The complete ES mappings produces by merging all the target type twins
   */
  private async getDigitalTwinMappings<TDigitalTwin extends TwinModelContent>(
    digitalTwinType: TwinType,
    models: TDigitalTwin[],
    measureModels: MeasureModelContent[],
  ) {
    const digitalTwinCollection =
      digitalTwinType === "asset"
        ? InternalCollection.ASSETS
        : InternalCollection.DEVICES;
    if (
      this.config.engineCollections[digitalTwinCollection]?.mappings ===
      undefined
    ) {
      throw new InternalError(`Cannot find mapping for "${digitalTwinType}"`);
    }

    const mappings = structuredClone(
      this.config.engineCollections[digitalTwinCollection].mappings,
    ) as JSONObject;

    this.mergeMetadataMappings(
      mappings.properties.metadata.properties,
      await fetchMetadataReferential(this.sdk, this.config.platformIndex),
      models.map((model) => model[digitalTwinType].metadataMappings),
    );

    for (const model of models) {
      for (const { type: measureType } of model[digitalTwinType]
        .measures as NamedMeasures) {
        if (!measureModels.some((m) => m.measure.type === measureType)) {
          throw new InternalError(
            `Cannot find measure "${measureType}" declared in ${[
              digitalTwinType,
            ]} "${model[digitalTwinType].model}"`,
          );
        }
      }
    }

    return mappings;
  }

  /**
   * Generate ES mappings from measures and theirs associated assets, all fetched via the database
   *
   * @param tenantClass The target tenant class
   * @returns The complete ES mappings produced by merging models mappings
   */
  private async getMeasuresMappingsFromDB(
    tenantClass: string,
    targetIndex?: string,
  ) {
    const models = await this.getModels<MeasureModelContent>(
      this.config.platformIndex,
      "measure",
    );

    const assetsMappings = await this.getDigitalTwinMappingsFromDB(
      "asset",
      tenantClass,
      targetIndex,
    );

    const deviceMappings = await this.getDigitalTwinMappingsFromDB("device");

    return this.getMeasuresMappings(models, assetsMappings, deviceMappings);
  }

  /**
   * Generate ES mappings from measures and theirs associated assets
   *
   * @param models The measures models
   * @param assetsMappings The assets complete mappings
   * @returns The complete ES mappings produced by merging models mappings
   */
  private getMeasuresMappings(
    models: MeasureModelContent[],
    assetsMappings: any,
    deviceMappings: any,
  ) {
    const mappings = structuredClone(measuresMappings) as JSONObject;

    for (const model of models) {
      merge(
        mappings.properties.values.properties,
        model.measure.valuesMappings,
      );
    }

    mappings.properties.asset.properties.metadata.properties =
      assetsMappings.properties.metadata.properties;

    mappings.properties.origin.properties.deviceMetadata.properties =
      deviceMappings.properties.metadata.properties;

    return mappings;
  }

  async getAssetGroupsMappingFromDB() {
    const models = await this.getModels<GroupModelContent>(
      this.config.platformIndex,
      "group",
    );
    const mappings = structuredClone(
      this.config.engineCollections.groups.mappings,
    ) as JSONObject;

    this.mergeMetadataMappings(
      mappings.properties.metadata.properties,
      await fetchMetadataReferential(this.sdk, this.config.platformIndex),
      models.map((model) => model.group.metadataMappings),
    );

    return mappings;
  }

  /**
   * Retrieve a certain type of models associated to an engine
   *
   * @param index The target engine Id
   * @param type The desired model type
   * @param tenantClass The target tenant class
   * @returns An array of the generic type provided
   */
  private async getModels<T extends KDocumentContentGeneric>(
    index: string,
    type: string,
    tenantClass?: string,
    targetIndex?: string,
  ): Promise<T[]> {
    const query: JSONObject = {
      and: [{ equals: { type } }],
    };

    if (tenantClass) {
      if (targetIndex) {
        // Tenant-aware: return models applicable to this specific engine
        // 3-level: tenant-scoped for this engine + class-scoped (no indexes) + commons (no indexes)
        query.and.push({
          or: [
            {
              and: [
                { equals: { indexes: targetIndex } },
                {
                  // ? Tenant-scoped asset models have no tenantClasses (exclusive with indexes)
                  or: [
                    { not: { exists: "tenantClasses" } },
                    { equals: { tenantClasses: tenantClass } },
                    { equals: { tenantClasses: "commons" } },
                  ],
                },
              ],
            },
            {
              and: [
                { not: { exists: "indexes" } },
                { equals: { tenantClasses: tenantClass } },
              ],
            },
            {
              and: [
                { not: { exists: "indexes" } },
                { equals: { tenantClasses: "commons" } },
              ],
            },
          ],
        });
      } else {
        // No target engine: return only class-scoped (no indexes) + commons (no indexes)
        query.and.push({
          and: [
            { not: { exists: "indexes" } },
            {
              or: [
                { equals: { tenantClasses: tenantClass } },
                { equals: { tenantClasses: "commons" } },
              ],
            },
          ],
        });
      }
    }

    const result = await this.sdk.document.search<T>(
      index,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 5000 },
    );

    return result.hits.map((elt) => elt._source);
  }

  /**
   * Detach all devices of an index in the platform index
   *
   * @param index The target engine Id
   * @returns {any}
   */
  private async detachDevicesFromPlatformIndex(index: string) {
    const devices = [];

    let result = await this.sdk.document.search(
      this.config.platformIndex,
      "devices",
      {
        _source: false,
        query: { bool: { must: { term: { index } } } },
      },
      {
        scroll: "2s",
        size: 100,
      },
    );
    while (result !== null) {
      devices.push(...result.hits);
      result = await result.next(); // NOSONAR: scroll pages are fetched sequentially
    }
    if (devices.length > 0) {
      void this.sdk.document.mUpdate(
        this.config.platformIndex,
        "devices",
        devices.map((device) => {
          return { _id: device._id, body: { index: null } };
        }),
      );
    }
  }
}
