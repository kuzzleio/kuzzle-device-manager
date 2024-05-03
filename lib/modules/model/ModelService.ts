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
import { JSONObject, KDocument } from "kuzzle-sdk";

import {
  AskEngineUpdateAll,
  AskEngineUpdateConflict,
  DeviceManagerPlugin,
  InternalCollection,
} from "../plugin";

import { AskAssetRefreshModel } from "../asset";
import { BaseService, flattenObject } from "../shared";
import { ModelSerializer } from "./ModelSerializer";
import {
  AssetModelContent,
  DeviceModelContent,
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
  AskModelMeasureGet,
} from "./types/ModelEvents";
import { MappingsConflictsError } from "./MappingsConflictsError";

export class ModelService extends BaseService {
  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);

    this.registerAskEvents();
  }

  registerAskEvents() {
    onAsk<AskModelAssetGet>(
      "ask:device-manager:model:asset:get",
      async ({ engineGroup, model }) => {
        const assetModel = await this.getAsset(engineGroup, model);

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
    onAsk<AskModelMeasureGet>(
      "ask:device-manager:model:measure:get",
      async ({ type }) => {
        const measureModel = await this.getMeasure(type);

        return measureModel._source;
      },
    );

    const genericModelsHandler = async (
      documents: KDocument<KDocumentContent>[],
      request: KuzzleRequest,
    ) => {
      const { index, collection } = request.input.args;

      if (index === this.config.adminIndex && collection === "models") {
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

        if (index === this.config.adminIndex && collection === "models") {
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

  async writeAsset(
    engineGroup: string,
    model: string,
    metadataMappings: MetadataMappings,
    defaultMetadata: JSONObject,
    metadataDetails: MetadataDetails,
    metadataGroups: MetadataGroups,
    measures: AssetModelContent["asset"]["measures"],
    tooltipModels: TooltipModels,
  ): Promise<KDocument<AssetModelContent>> {
    if (Inflector.pascalCase(model) !== model) {
      throw new BadRequestError(`Asset model "${model}" must be PascalCase.`);
    }

    const modelContent: AssetModelContent = {
      asset: {
        defaultMetadata,
        measures,
        metadataDetails,
        metadataGroups,
        metadataMappings,
        model,
        tooltipModels,
      },
      engineGroup,
      type: "asset",
    };

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
        this.config.adminIndex,
        InternalCollection.MODELS,
        ModelSerializer.id<AssetModelContent>("asset", modelContent),
        modelContent,
      );

    await this.sdk.collection.refresh(
      this.config.adminIndex,
      InternalCollection.MODELS,
    );
    await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");

    await ask<AskAssetRefreshModel>("ask:device-manager:asset:refresh-model", {
      assetModel: modelContent,
    });

    return assetModel;
  }

  private checkDefaultValues(
    metadataMappings: MetadataMappings,
    defaultMetadata: JSONObject,
  ) {
    const metadata = Object.keys(
      JSON.parse(
        JSON.stringify(flattenObject(metadataMappings))
          .replace(/properties\./g, "")
          .replace(/\.type/g, ""),
      ),
    );

    const values = Object.keys(flattenObject(defaultMetadata));

    for (let i = 0; i < values.length; i++) {
      if (!metadata.includes(values[i])) {
        throw new BadRequestError(
          `The default value "${values[i]}" is not in the metadata mappings.`,
        );
      }
    }
  }

  async writeDevice(
    model: string,
    metadataMappings: MetadataMappings,
    defaultMetadata: JSONObject,
    metadataDetails: MetadataDetails,
    metadataGroups: MetadataGroups,
    measures: DeviceModelContent["device"]["measures"],
  ): Promise<KDocument<DeviceModelContent>> {
    if (Inflector.pascalCase(model) !== model) {
      throw new BadRequestError(`Device model "${model}" must be PascalCase.`);
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
        `New assets mappings are causing conflicts`,
        conflicts,
      );
    }

    const deviceModel =
      await this.sdk.document.createOrReplace<DeviceModelContent>(
        this.config.adminIndex,
        InternalCollection.MODELS,
        ModelSerializer.id<DeviceModelContent>("device", modelContent),
        modelContent,
      );

    await this.sdk.collection.refresh(
      this.config.adminIndex,
      InternalCollection.MODELS,
    );
    await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");

    return deviceModel;
  }

  async writeMeasure(
    type: string,
    valuesMappings: JSONObject,
  ): Promise<KDocument<MeasureModelContent>> {
    const modelContent: MeasureModelContent = {
      measure: { type, valuesMappings },
      type: "measure",
    };

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
        this.config.adminIndex,
        InternalCollection.MODELS,
        ModelSerializer.id<MeasureModelContent>("measure", modelContent),
        modelContent,
      );

    await this.sdk.collection.refresh(
      this.config.adminIndex,
      InternalCollection.MODELS,
    );
    await ask<AskEngineUpdateAll>("ask:device-manager:engine:updateAll");

    return measureModel;
  }

  async deleteAsset(_id: string) {
    await this.sdk.document.delete(
      this.config.adminIndex,
      InternalCollection.MODELS,
      _id,
    );
  }

  async deleteDevice(_id: string) {
    await this.sdk.document.delete(
      this.config.adminIndex,
      InternalCollection.MODELS,
      _id,
    );
  }

  async deleteMeasure(_id: string) {
    await this.sdk.document.delete(
      this.config.adminIndex,
      InternalCollection.MODELS,
      _id,
    );
  }

  async listAsset(
    engineGroup: string,
  ): Promise<KDocument<AssetModelContent>[]> {
    const query = {
      and: [{ equals: { type: "asset" } }, { equals: { engineGroup } }],
    };
    const sort = { "asset.model": "asc" };

    const result = await this.sdk.document.search<AssetModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query, sort },
      { lang: "koncorde", size: 5000 },
    );

    return result.hits;
  }

  async listDevices(): Promise<KDocument<DeviceModelContent>[]> {
    const query = {
      and: [{ equals: { type: "device" } }],
    };
    const sort = { "device.model": "asc" };

    const result = await this.sdk.document.search<DeviceModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query, sort },
      { lang: "koncorde", size: 5000 },
    );

    return result.hits;
  }

  async listMeasures(): Promise<KDocument<MeasureModelContent>[]> {
    const query = {
      and: [{ equals: { type: "measure" } }],
    };
    const sort = { "measure.type": "asc" };

    const result = await this.sdk.document.search<MeasureModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query, sort },
      { lang: "koncorde", size: 5000 },
    );

    return result.hits;
  }

  async assetExists(model: string): Promise<boolean> {
    const query = {
      and: [
        { equals: { type: "asset" } },
        { equals: { "asset.model": model } },
      ],
    };

    const result = await this.sdk.document.search(
      this.config.adminIndex,
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
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 1 },
    );

    return result.total > 0;
  }

  async getAsset(
    engineGroup: string,
    model: string,
  ): Promise<KDocument<AssetModelContent>> {
    const query = {
      and: [
        { equals: { engineGroup } },
        { equals: { type: "asset" } },
        { equals: { "asset.model": model } },
      ],
    };

    const result = await this.sdk.document.search<AssetModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 1 },
    );

    if (result.total === 0) {
      throw new NotFoundError(`Unknown Asset model "${model}".`);
    }

    return result.hits[0];
  }

  async getDevice(model: string): Promise<KDocument<DeviceModelContent>> {
    const query = {
      and: [
        { equals: { type: "device" } },
        { equals: { "device.model": model } },
      ],
    };

    const result = await this.sdk.document.search<DeviceModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 1 },
    );

    if (result.total === 0) {
      throw new NotFoundError(`Unknown Device model "${model}".`);
    }

    return result.hits[0];
  }

  async getMeasure(type: string): Promise<KDocument<MeasureModelContent>> {
    const query = {
      and: [
        { equals: { type: "measure" } },
        { equals: { "measure.type": type } },
      ],
    };

    const result = await this.sdk.document.search<MeasureModelContent>(
      this.config.adminIndex,
      InternalCollection.MODELS,
      { query },
      { lang: "koncorde", size: 1 },
    );

    if (result.total === 0) {
      throw new NotFoundError(`Unknown Measure type "${type}".`);
    }

    return result.hits[0];
  }

  /**
   * Update an asset model
   */
  async updateAsset(
    _id: string,
    engineGroup: string,
    model: string,
    metadataMappings: MetadataMappings,
    defaultMetadata: JSONObject,
    metadataDetails: MetadataDetails,
    metadataGroups: MetadataGroups,
    measures: AssetModelContent["asset"]["measures"],
    tooltipModels: TooltipModels,
    request: KuzzleRequest,
  ): Promise<KDocument<AssetModelContent>> {
    if (Inflector.pascalCase(model) !== model) {
      throw new BadRequestError(`Asset model "${model}" must be PascalCase.`);
    }

    this.checkDefaultValues(metadataMappings, defaultMetadata);

    const assetModel = {
      _id,
      _source: {
        asset: {
          defaultMetadata,
          measures,
          metadataDetails,
          metadataGroups,
          metadataMappings,
          model,
          tooltipModels,
        },
      },
    };

    await this.updateDocument<AssetModelContent>(
      request,
      assetModel,
      {
        collection: InternalCollection.MODELS,
        engineId: this.config.adminIndex,
      },
      { source: true },
    );

    await this.sdk.collection.refresh(
      this.config.adminIndex,
      InternalCollection.MODELS,
    );

    const endDocument = await this.getAsset(engineGroup, model);
    return endDocument;
  }
}
