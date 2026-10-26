import {
  BadRequestError,
  KuzzleRequest,
  NotFoundError,
  PartialError,
  User,
} from "kuzzle";
import { ask, onAsk } from "kuzzle-plugin-commons";
import {
  JSONObject,
  KDocument,
  KHit,
  SearchResult,
  mReplaceResponse,
} from "kuzzle-sdk";
import set from "lodash/set";

import {
  AskDeviceAttachEngine,
  AskDeviceDetachEngine,
  DeviceSerializer,
} from "../device";
import {
  AskModelAssetGet,
  AskModelMeasureGet,
  AssetModelContent,
} from "../model";
import {
  AskEngineList,
  DeviceManagerPlugin,
  InternalCollection,
} from "../plugin";
import {
  DigitalTwinService,
  Metadata,
  SearchParams,
  flattenObject,
  lock,
} from "../shared";
import { KuzzleLogger } from "kuzzle-logger";

import { AssetHistoryService } from "./AssetHistoryService";
import { AssetSerializer } from "./model/AssetSerializer";
import {
  ApiAssetMigrateTenantResult,
  ApiAssetUnlinkDevicesResult,
  ApiAssetUpdateModelLocales,
} from "./types/AssetApi";
import { AssetContent } from "./types/AssetContent";
import {
  AskAssetRefreshModel,
  EventAssetUpdateAfter,
  EventAssetUpdateBefore,
} from "./types/AssetEvents";
import {
  AssetHistoryContent,
  AssetHistoryEventMetadata,
} from "./types/AssetHistoryContent";

export class AssetService extends DigitalTwinService {
  readonly assetHistoryService: AssetHistoryService;
  readonly logger: KuzzleLogger;
  constructor(
    plugin: DeviceManagerPlugin,
    assetHistoryService: AssetHistoryService,
    assetLogger: KuzzleLogger,
  ) {
    super(plugin, InternalCollection.ASSETS);

    this.assetHistoryService = assetHistoryService;
    this.logger = assetLogger;
  }

  override registerAskEvents() {
    super.registerAskEvents();

    onAsk<AskAssetRefreshModel>(
      "ask:device-manager:asset:refresh-model",
      this.refreshModel.bind(this),
    );
  }

  public async get(
    index: string,
    assetId: string,
    request: KuzzleRequest,
  ): Promise<KDocument<AssetContent>> {
    return this.getDocument<AssetContent>(request, assetId, {
      collection: InternalCollection.ASSETS,
      index,
    });
  }

  /**
   * Update an asset metadata
   */
  public async update(
    index: string,
    assetId: string,
    metadata: Metadata,
    request: KuzzleRequest,
  ): Promise<KDocument<AssetContent>> {
    return lock(`asset:${index}:${assetId}`, async () => {
      const asset = await this.get(index, assetId, request);

      const updatedPayload = await this.app.trigger<EventAssetUpdateBefore>(
        "device-manager:asset:update:before",
        { asset, metadata },
      );

      const updatedAsset = await this.updateDocument<AssetContent>(
        request,
        {
          _id: assetId,
          _source: { metadata: updatedPayload.metadata },
        },
        {
          collection: InternalCollection.ASSETS,
          index,
        },
        { source: true },
      );

      await this.assetHistoryService.add<AssetHistoryEventMetadata>(index, [
        {
          asset: updatedAsset._source,
          event: {
            metadata: {
              names: Object.keys(flattenObject(updatedPayload.metadata)),
            },
            name: "metadata",
          },
          id: updatedAsset._id,
          timestamp: Date.now(),
        },
      ]);

      await this.app.trigger<EventAssetUpdateAfter>(
        "device-manager:asset:update:after",
        {
          asset: updatedAsset,
          metadata: updatedPayload.metadata,
        },
      );

      return updatedAsset;
    });
  }

  /**
   * Replace an asset metadata
   */
  public async replaceMetadata(
    index: string,
    assetId: string,
    metadata: Metadata,
    request: KuzzleRequest,
  ): Promise<KDocument<AssetContent>> {
    return lock(`asset:${index}:${assetId}`, async () => {
      const asset = await this.get(index, assetId, request);
      const unknownMetadata = {};
      for (const key in metadata) {
        if (key in asset._source.metadata) {
          asset._source.metadata[key] = metadata[key];
        } else {
          unknownMetadata[key] = metadata[key];
        }
      }
      // ? If metadata key is unknown on the asset we check that it exists in the assetModel mappings
      if (Object.keys(unknownMetadata).length > 0) {
        const assetModel = await ask<AskModelAssetGet>(
          "ask:device-manager:model:asset:get",
          {
            tenantClasses: [index.split("-")[1]],
            index,
            model: asset._source.model,
          },
        );
        for (const key of Object.keys(unknownMetadata)) {
          // ? Same as update, which the strict mappings refuse
          if (!(key in assetModel.asset.metadataMappings)) {
            throw new BadRequestError(
              `Metadata "${key}" is not defined on asset model "${asset._source.model}".`,
            );
          }

          asset._source.metadata[key] = unknownMetadata[key];
        }
      }
      const updatedPayload = await this.app.trigger<EventAssetUpdateBefore>(
        "device-manager:asset:update:before",
        { asset, metadata },
      );

      const updatedAsset = await this.sdk.document.replace<AssetContent>(
        index,
        InternalCollection.ASSETS,
        assetId,
        updatedPayload.asset._source,
        { triggerEvents: true },
      );

      await this.assetHistoryService.add<AssetHistoryEventMetadata>(index, [
        {
          asset: updatedAsset._source,
          event: {
            metadata: {
              names: Object.keys(flattenObject(updatedPayload.metadata)),
            },
            name: "metadata",
          },
          id: updatedAsset._id,
          timestamp: Date.now(),
        },
      ]);

      await this.app.trigger<EventAssetUpdateAfter>(
        "device-manager:asset:update:after",
        {
          asset: updatedAsset,
          metadata: updatedPayload.metadata,
        },
      );

      return updatedAsset;
    });
  }

  /**
   * Update or Create an asset metadata
   */
  public async upsert(
    index: string,
    model: string,
    reference: string,
    metadata: Metadata,
    request: KuzzleRequest,
  ): Promise<KDocument<AssetContent>> {
    this.checkReference(reference);
    const assetId = AssetSerializer.id(model, reference);

    return lock(`asset:${index}:${assetId}`, async () => {
      const asset = await this.get(index, assetId, request).catch(
        async (error) => {
          // ? A pipe may hide the asset from the user: creating it over would
          // ? tell them it exists
          if (
            await this.sdk.document.exists(
              index,
              InternalCollection.ASSETS,
              assetId,
            )
          ) {
            throw error;
          }

          return null;
        },
      );

      if (!asset) {
        return this._create(
          assetId,
          index,
          model,
          reference,
          metadata,
          request,
        );
      }

      const updatedPayload = await this.app.trigger<EventAssetUpdateBefore>(
        "device-manager:asset:update:before",
        { asset, metadata },
      );

      const updatedAsset = await this.updateDocument<AssetContent>(
        request,
        {
          _id: assetId,
          _source: { metadata: updatedPayload.metadata },
        },
        {
          collection: InternalCollection.ASSETS,
          index,
        },
        { source: true },
      );

      await this.assetHistoryService.add<AssetHistoryEventMetadata>(index, [
        {
          asset: updatedAsset._source,
          event: {
            metadata: {
              names: Object.keys(flattenObject(updatedPayload.metadata)),
            },
            name: "metadata",
          },
          id: updatedAsset._id,
          timestamp: Date.now(),
        },
      ]);

      await this.app.trigger<EventAssetUpdateAfter>(
        "device-manager:asset:update:after",
        {
          asset: updatedAsset,
          metadata: updatedPayload.metadata,
        },
      );

      return updatedAsset;
    });
  }

  private async _create(
    assetId: string,
    index: string,
    model: string,
    reference: string,
    metadata: JSONObject,
    request: KuzzleRequest,
  ): Promise<KDocument<AssetContent>> {
    const engine = await this.getEngine(index);
    const assetModel = await ask<AskModelAssetGet>(
      "ask:device-manager:model:asset:get",
      {
        tenantClasses: [engine.group],
        index,
        model,
      },
    );

    const assetMetadata = {};
    for (const metadataName of Object.keys(assetModel.asset.metadataMappings)) {
      assetMetadata[metadataName] = null;
    }
    for (const [metadataName, metadataValue] of Object.entries(
      assetModel.asset.defaultMetadata,
    )) {
      set(assetMetadata, metadataName, metadataValue);
    }

    const asset = await this.createDocument<AssetContent>(
      request,
      {
        _id: assetId,
        _source: {
          groups: [],
          linkedMeasures: [],
          measureSlots: assetModel.asset.measures,
          metadata: { ...assetMetadata, ...metadata },
          model,
          modelLocales: assetModel.asset.locales,
          reference,
        },
      },
      {
        collection: InternalCollection.ASSETS,
        index,
      },
    );

    await this.assetHistoryService.add<AssetHistoryEventMetadata>(index, [
      {
        asset: asset._source,
        event: {
          metadata: {
            names: Object.keys(flattenObject(asset._source.metadata)),
          },
          name: "metadata",
        },
        id: asset._id,
        timestamp: Date.now(),
      },
    ]);

    return asset;
  }

  /**
   * Create an asset metadata
   */
  public async create(
    index: string,
    model: string,
    reference: string,
    metadata: JSONObject,
    request: KuzzleRequest,
  ): Promise<KDocument<AssetContent>> {
    this.checkReference(reference);
    const assetId = AssetSerializer.id(model, reference);
    return lock(`asset:${index}:${assetId}`, async () =>
      this._create(assetId, index, model, reference, metadata, request),
    );
  }

  /**
   * Delete an asset metadata
   */
  public async delete(index: string, assetId: string, request: KuzzleRequest) {
    const strict = request.getBoolean("strict");

    return lock<void>(`asset:${index}:${assetId}`, async () => {
      const asset = await this.get(index, assetId, request);

      if (strict && asset._source.linkedMeasures.length !== 0) {
        throw new BadRequestError(
          `Asset "${assetId}" is still linked to devices.`,
        );
      }

      for (const { deviceId } of asset._source.linkedMeasures) {
        await this.unlinkAssetDevice(deviceId, assetId, [], true, request); // NOSONAR: sequential: each unlink updates the same asset
      }

      await this.deleteDocument(request, assetId, {
        collection: InternalCollection.ASSETS,
        index,
      });
    });
  }

  public async search(
    index: string,
    searchParams: SearchParams,
    request: KuzzleRequest,
  ): Promise<SearchResult<KHit<AssetContent>>> {
    return this.searchDocument<AssetContent>(request, searchParams, {
      collection: InternalCollection.ASSETS,
      index,
    });
  }

  public async unlinkDevices(
    assetId: string,
    allMeasures: boolean,
    deviceIds: string[],
    measureSlots: string[],
    request: KuzzleRequest,
  ): Promise<ApiAssetUnlinkDevicesResult> {
    const index = request.getIndex();
    let asset = await this.get(index, assetId, request);
    const devices = [];

    // CASE ALL MEASURES TO UNLINK
    if (allMeasures) {
      const devicesToUnlink = asset._source.linkedMeasures.map(
        (m) => m.deviceId,
      );
      if (devicesToUnlink.length === 0) {
        throw new BadRequestError(
          `Asset ${assetId} has no measure to be unlinked`,
        );
      }
      for (const device of devicesToUnlink) {
        const { asset: updatedAsset, device: updatedDevice } =
          await this.unlinkAssetDevice(device, assetId, [], true, request); // NOSONAR: sequential: each unlink updates the same asset
        devices.push(DeviceSerializer.serialize(updatedDevice));
        asset = AssetSerializer.serialize(updatedAsset);
      }
      return { asset, devices };
    }

    // CASE ALL MEASURES FROM SPECIFIC ASSETS TO UNLINK
    for (const device of deviceIds) {
      const { asset: updatedAsset, device: updatedDevice } =
        await this.unlinkAssetDevice(device, assetId, [], true, request); // NOSONAR: sequential: each unlink updates the same asset
      devices.push(DeviceSerializer.serialize(updatedDevice));
      asset = AssetSerializer.serialize(updatedAsset);
    }

    // CASE SPECIFIC DEVICE SLOTS
    // FOR EVERY LINK THAT HAS A SLOT TO UNLINK
    for (const linkedMeasures of asset._source.linkedMeasures.filter((l) =>
      l.measureSlots.some((s) => measureSlots.includes(s.asset)),
    )) {
      const { asset: updatedAsset, device: updatedDevice } =
        // prettier-ignore
        await this.unlinkAssetDevice( // NOSONAR: sequential: each unlink updates the same asset
          linkedMeasures.deviceId,
          assetId,
          linkedMeasures.measureSlots.filter((slot) =>
            measureSlots.includes(slot.asset),
          ),
          false,
          request,
        );
      devices.push(DeviceSerializer.serialize(updatedDevice));
      asset = AssetSerializer.serialize(updatedAsset);
    }

    return { asset, devices };
  }

  public async migrateTenant(
    user: User,
    assetsList: string[],
    index: string,
    newIndex: string,
    includeDevices: boolean,
    request: KuzzleRequest,
  ): Promise<ApiAssetMigrateTenantResult> {
    let errors = [];
    let successes = [];

    //Sanity check
    if (assetsList.length === 0) {
      throw new BadRequestError("No assets to migrate");
    }

    await lock(`engine:${index}:${newIndex}`, async () => {
      if (!user.profileIds.includes("admin")) {
        throw new BadRequestError(
          `User ${user._id} is not authorized to migrate assets`,
        );
      }

      // check if tenant destination is of the same tenant class
      const engine = await this.getEngine(index);
      const newEngine = await this.getEngine(newIndex);

      if (engine.group !== newEngine.group) {
        throw new BadRequestError(
          `Engine ${newIndex} is not of the same tenant class as ${index}`,
        );
      }

      //First of all, as mCreate seems to be buggy, ensure some assets don't
      //already exists in the destination tenant
      const assetsCheck = await this.sdk.document.mGet<AssetContent>(
        newIndex,
        InternalCollection.ASSETS,
        assetsList,
      );
      const assetsCheckedIdExisting = assetsCheck.successes.map((a) => a._id);
      errors = [...assetsCheckedIdExisting];

      //Get all assets to migrate
      const assetsCheckedList = assetsList.filter(
        (id) => !assetsCheckedIdExisting.includes(id),
      );

      if (assetsCheckedList.length === 0) {
        throw new BadRequestError(
          "All assets to migrate already exists in destination tenant.",
        );
      }

      const assets = await this.sdk.document.mGet<AssetContent>(
        index,
        InternalCollection.ASSETS,
        assetsCheckedList,
      );
      errors = errors.concat(...assets.errors);

      if (assets.successes.length === 0) {
        this.logger.error("No assets found to migrate");
        return { errors, successes };
      }

      //Get all the asset content, in order to create thm by batch
      const assetsContent = assets.successes.map((asset) => ({
        _id: asset._id,
        body: asset._source,
      }));

      //We want to create the new asset with linked devices and groups empty
      const assetsContentCopy = structuredClone(assetsContent);
      for (const asset of assetsContentCopy) {
        asset.body.linkedMeasures = [];
        asset.body.groups = [];
      }

      //Even if they exist in the destination tenant, try creating them all
      //using batch
      const assetsCreated = await this.sdk.document.mCreate(
        newIndex,
        InternalCollection.ASSETS,
        assetsContentCopy,
      );

      //We consider here we will return as success what we have been able
      //to create, and related errors
      const assetsCreatedId = assetsCreated.successes.map((a) => a._id);
      const assetsNotCreatedId = assetsCreated.errors.map(
        (a) => a.document._id,
      );
      successes = [...assetsCreatedId];
      errors = errors.concat(...assetsNotCreatedId);

      //Iterate over all created asset, and migrate each one
      for (const asset of assetsCreated.successes) {
        //We need to recover the linked devices to this asset,
        //because we reset them when we create the asset
        const assetOriginal = assets.successes.find((a) => a._id === asset._id);

        // get linked devices to this asset, if any
        const linkedMeasures = assetOriginal._source.linkedMeasures;

        // ... and iterate over this list
        for (const link of linkedMeasures) {
          if (includeDevices === true) {
            // detach linked devices from current tenant (it also unkinks asset)
            await ask<AskDeviceDetachEngine>(
              "ask:device-manager:device:detach-engine",
              {
                // NOSONAR: sequential: device moves must complete in order
                deviceId: link.deviceId,
                user,
              },
            );

            // ... and attach to new tenant
            await ask<AskDeviceAttachEngine>(
              "ask:device-manager:device:attach-engine",
              {
                // NOSONAR: sequential: device moves must complete in order
                deviceId: link.deviceId,
                index: newIndex,
                user,
              },
            );

            // ... and link this device to the asset in the new tenant
            // prettier-ignore
            await this.linkAssetDevice( // NOSONAR: sequential: device moves must complete in order
              newIndex,
              link.deviceId,
              asset._id,
              link.measureSlots,
              false,
              request,
            );
          } else {
            // prettier-ignore
            await this.unlinkAssetDevice( // NOSONAR: sequential: each unlink updates the same asset
              link.deviceId,
              asset._id,
              link.measureSlots,
              false,
              request,
            );
          }
        }
      }

      // Finally here, we can delete the successefully migrated assets from the source engine !
      await this.sdk.document.mDelete(
        index,
        InternalCollection.ASSETS,
        assetsCreatedId,
      );

      //Refresh ES indexes and collections
      const collectionsToRefresh = [
        {
          collection: InternalCollection.ASSETS,
          index: index,
        },
        {
          collection: InternalCollection.DEVICES,
          index: index,
        },
        {
          collection: InternalCollection.ASSETS,
          index: newIndex,
        },
        {
          collection: InternalCollection.DEVICES,
          index: newIndex,
        },
        {
          collection: InternalCollection.DEVICES,
          index: this.config.platformIndex,
        },
      ].map((target) => {
        return this.sdk.collection.refresh(target.index, target.collection);
      });

      await Promise.all(collectionsToRefresh);
    });

    return { errors, successes };
  }

  /**
   * Replace an asset metadata
   */
  public async mReplaceAndHistorize(
    index: string,
    assets: KDocument<AssetContent>[],
    removedMetadata: string[],
    { refresh }: { refresh: any },
  ): Promise<mReplaceResponse> {
    const replacedAssets = await this.sdk.document.mReplace<AssetContent>(
      index,
      InternalCollection.ASSETS,
      assets.map((asset) => ({ _id: asset._id, body: asset._source })),
      { refresh, source: true },
    );

    const histories: AssetHistoryContent[] = replacedAssets.successes.map(
      (asset) => ({
        asset: asset._source as AssetContent,
        event: {
          metadata: {
            names: Object.keys(flattenObject(asset._source.metadata)),
          },
          name: "metadata",
        },
        id: asset._id,
        timestamp: Date.now(),
      }),
    );

    await this.assetHistoryService.add<AssetHistoryEventMetadata>(
      index,
      histories,
    );

    return replacedAssets;
  }

  /**
   * Retrieve locales with the specified model and search all assets related to the model to update the locales.
   * The operation is historized.
   * @param request
   * @param model
   */
  public async updateModelLocales(
    request: KuzzleRequest,
    model: string,
  ): Promise<ApiAssetUpdateModelLocales[]> {
    const res = await this.sdk.document.search<AssetModelContent>(
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
      { size: 1 },
    );

    if (res.total === 0) {
      throw new NotFoundError(`Unknown Asset model '${model}'.`);
    }

    const modelDocument = res.hits[0];
    const locales = modelDocument._source.asset.locales;

    const engines = await ask<AskEngineList>(
      "ask:device-manager:engine:list",
      {},
    );

    // ? The action takes no index, so Kuzzle ignores the index restrictions
    const allowed = await Promise.all(
      engines.map((engine) => this.isAllowedOnEngine(engine.index, request)),
    );
    const allowedEngines = engines.filter((engine, i) => allowed[i]);

    const results: ApiAssetUpdateModelLocales[] = await Promise.all(
      allowedEngines.map(async (engine) => {
        const resultUpdateByQuery =
          await this.sdk.document.updateByQuery<AssetContent>( // NOSONAR: sequential: throttle updateByQuery across engines
            engine.index,
            "assets",
            {
              bool: {
                must: [
                  {
                    term: {
                      model: model,
                    },
                  },
                ],
              },
            },
            {
              modelLocales: locales,
            },
          );

        return {
          engineIndex: engine.index,
          result: {
            errors: [...resultUpdateByQuery.errors],
            successes: [...resultUpdateByQuery.successes],
          },
        };
      }),
    );

    const errorsFiltered = results.filter((re) => re.result.errors.length > 0);

    if (errorsFiltered.length === results.length) {
      throw new BadRequestError("All the assets failed to be updated", {}, 400);
    }

    if (errorsFiltered.length < results.length && errorsFiltered.length !== 0) {
      throw new PartialError(
        "Some assets failed to be updated",
        errorsFiltered,
        {},
        206,
      );
    }

    return results;
  }

  public async addMeasureSlot(
    assetId: string,
    measureSlot: AssetContent["measureSlots"][0],
    index: string,
    request: KuzzleRequest,
  ): Promise<KDocument<AssetContent>> {
    const asset = await this.get(index, assetId, request);
    if (
      asset._source.measureSlots.some((slot) => slot.name === measureSlot.name)
    ) {
      throw new BadRequestError(
        `A measure slot with ${measureSlot.name} as a name already exists for ${assetId}`,
      );
    }
    try {
      await ask<AskModelMeasureGet>("ask:device-manager:model:measure:get", {
        type: measureSlot.type,
        index,
      });
    } catch {
      throw new BadRequestError(
        `There is no measure of type ${measureSlot.type} registered.`,
      );
    }
    asset._source.measureSlots.push(measureSlot);
    const updatedAsset = await this.updateDocument<AssetContent>(
      request,
      asset,
      {
        collection: InternalCollection.ASSETS,
        index,
      },
    );
    return updatedAsset;
  }
  public async removeMeasureSlot(
    assetId: string,
    measureSlotName: string,
    index: string,
    request: KuzzleRequest,
  ): Promise<KDocument<AssetContent>> {
    const asset = await this.get(index, assetId, request);
    if (
      !asset._source.measureSlots.some((slot) => slot.name === measureSlotName)
    ) {
      throw new BadRequestError(
        `Asset ${assetId} does not have a measure slot named ${measureSlotName}`,
      );
    }
    const linkedDevice = asset._source.linkedMeasures.find((link) =>
      link.measureSlots.some((slot) => slot.asset === measureSlotName),
    );
    if (linkedDevice) {
      throw new BadRequestError(
        `Measure slot ${measureSlotName} can not be removed as it is currently linked to ${linkedDevice.deviceId}`,
      );
    }
    const engine = await this.getEngine(index);
    const assetModel = await this.getAssetModel(
      engine.group,
      asset._source.model,
      index,
    );
    if (!assetModel) {
      throw new NotFoundError(`Model ${asset._source.model} not found`);
    }
    if (assetModel.asset.measures.some((m) => m.name === measureSlotName)) {
      throw new BadRequestError(
        `Measure slot ${measureSlotName} can not be removed as it is set in the ${asset._source.model} model`,
      );
    }
    asset._source.measureSlots = asset._source.measureSlots.filter(
      (slot) => slot.name !== measureSlotName,
    );
    const updatedAsset = await this.updateDocument<AssetContent>(
      request,
      asset,
      {
        collection: InternalCollection.ASSETS,
        index,
      },
    );
    return updatedAsset;
  }

  /**
   * Update the display name of a measure slot on an asset
   */
  public async updateMeasureSlotDisplayName(
    assetId: string,
    measureSlotName: string,
    displayName: { [locale: string]: string },
    index: string,
    request: KuzzleRequest,
  ): Promise<KDocument<AssetContent>> {
    const asset = await this.get(index, assetId, request);

    const slot = asset._source.measureSlots.find(
      (s) => s.name === measureSlotName,
    );
    if (!slot) {
      throw new BadRequestError(
        `Asset ${assetId} does not have a measure slot named ${measureSlotName}`,
      );
    }
    slot.displayName = displayName;

    const updatedAsset = await this.updateDocument<AssetContent>(
      request,
      asset,
      {
        collection: InternalCollection.ASSETS,
        index,
      },
    );
    return updatedAsset;
  }

  private async refreshModel({
    assetModel,
  }: {
    assetModel: AssetModelContent;
  }): Promise<void> {
    const engines = await this.getModelEngines(assetModel);

    const modelMetadata = {};

    for (const metadataName of Object.keys(assetModel.asset.metadataMappings)) {
      const defaultMetadata = assetModel.asset.defaultMetadata[metadataName];
      modelMetadata[metadataName] = defaultMetadata ?? null;
    }

    for (const engine of engines) {
      // ? Scroll by pages matching the write limit, the default search size (10) would miss assets
      let result = await this.sdk.document.search<AssetContent>( // NOSONAR: sequential: throttle writes across engines
        engine.index,
        InternalCollection.ASSETS,
        { query: { equals: { model: assetModel.asset.model } } },
        { lang: "koncorde", scroll: "10s", size: 200 },
      );

      while (result) {
        const removedMetadata: string[] = [];

        const updatedAssets = result.hits.map((asset) => {
          const assetMetadata = { ...asset._source.metadata };

          for (const key of Object.keys(asset._source.metadata)) {
            if (!(key in modelMetadata)) {
              removedMetadata.push(key);
              delete assetMetadata[key];
            }
          }

          const customMeasureSlots = asset._source.measureSlots.filter(
            (slot) =>
              !assetModel.asset.measures.some((m) => m.name === slot.name),
          );

          return {
            _id: asset._id,
            _source: {
              ...asset._source,
              measureSlots: [
                ...assetModel.asset.measures,
                ...customMeasureSlots,
              ],
              metadata: { ...modelMetadata, ...assetMetadata },
            },
          } as KDocument<AssetContent>;
        });

        if (updatedAssets.length > 0) {
          // prettier-ignore
          await this.mReplaceAndHistorize( // NOSONAR: sequential: write page before scrolling
            engine.index,
            updatedAssets,
            removedMetadata,
            {
              refresh: "wait_for",
            },
          );
        }

        result = await result.next(); // NOSONAR: sequential: scroll pagination
      }
    }
  }

  /**
   * Lists the engines whose assets use the given model:
   * the model indexes for a tenant-scoped model, every engine for a commons model,
   * and the engines of the model tenantClasses otherwise.
   */
  private async getModelEngines(assetModel: AssetModelContent) {
    const engines = await ask<AskEngineList>(
      "ask:device-manager:engine:list",
      {},
    );

    if (assetModel.indexes?.length > 0) {
      return engines.filter((engine) =>
        assetModel.indexes.includes(engine.index),
      );
    }

    if (assetModel.tenantClasses?.includes("commons")) {
      return engines;
    }

    return engines.filter((engine) =>
      assetModel.tenantClasses?.includes(engine.group),
    );
  }

  /**
   * The reference is part of the asset id
   */
  private checkReference(reference: string) {
    if (reference.trim() === "") {
      throw new BadRequestError("The asset reference must not be empty.");
    }
  }
}
