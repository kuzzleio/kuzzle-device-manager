import { BadRequestError, ForbiddenError, KuzzleRequest } from "kuzzle";
import { ask, onAsk } from "kuzzle-plugin-commons";
import { JSONObject, KDocument, KHit, SearchResult } from "kuzzle-sdk";

import { DecodedMeasurement } from "../measure";
import { DeviceModelContent } from "../model";
import {
  AskEngineList,
  DeviceManagerPlugin,
  InternalCollection,
} from "../plugin";
import { DigitalTwinService, Metadata, SearchParams, lock } from "../shared";
import {
  AskAssetHistoryAdd,
  AssetContent,
  AssetHistoryEventUnlink,
  AssetSerializer,
} from "../asset";

import { AskPayloadReceiveFormated } from "../decoder/types/InternalEvents";
import { DeviceSerializer } from "./model/DeviceSerializer";
import {
  DeviceProvisioningContent,
  DeviceContent,
} from "./types/DeviceContent";
import {
  AskDeviceAttachEngine,
  AskDeviceDetachEngine,
  AskDeviceRefreshModel,
  EventDeviceUpdateAfter,
  EventDeviceUpdateBefore,
} from "./types/DeviceEvents";
import { ApiDeviceUnlinkAssetsResult } from "./exports";
import { KuzzleLogger } from "kuzzle-logger";

// ? Device ids ("model-reference") must fit in an Elasticsearch _id (512 bytes)
const MAX_REFERENCE_BYTES = 256;

export class DeviceService extends DigitalTwinService {
  readonly logger: KuzzleLogger;
  constructor(plugin: DeviceManagerPlugin, logger: KuzzleLogger) {
    super(plugin, InternalCollection.DEVICES);
    this.logger = logger;
  }

  override registerAskEvents() {
    super.registerAskEvents();
    onAsk<AskDeviceDetachEngine>(
      "ask:device-manager:device:detach-engine",
      async ({ deviceId, user }) => {
        const request = new KuzzleRequest({ refresh: "false" }, { user });
        await this.detachEngine(deviceId, request);
      },
    );

    onAsk<AskDeviceAttachEngine>(
      "ask:device-manager:device:attach-engine",
      async ({ deviceId, index, user }) => {
        const request = new KuzzleRequest({ refresh: "false" }, { user });
        await this.attachEngine(index, deviceId, request);
      },
    );
    onAsk<AskDeviceRefreshModel>(
      "ask:device-manager:device:refresh-model",
      this.refreshModel.bind(this),
    );
  }

  private async _create(
    deviceId: string,
    model: string,
    reference: string,
    metadata: JSONObject,
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceContent>> {
    let device: KDocument<DeviceContent> = {
      _id: deviceId,
      _source: {
        index: null,
        groups: [],
        linkedMeasures: [],
        measureSlots: [],
        metadata,
        model,
        reference,
      },
    };

    const deviceModel = await this.getDeviceModel(model);
    const index = request.getString("index", "");

    device._source.measureSlots = deviceModel.device.measures;

    const refreshableCollections: Array<{
      index: string;
      collection: string;
    }> = [];
    await this._createDeviceProvisioning(device, request);

    refreshableCollections.push({
      collection: InternalCollection.DEVICES,
      index: this.config.platformIndex,
    });
    if (index.trim() !== "" && index !== this.config.platformIndex) {
      try {
        device = await this._attachEngine(index, device._id, request, metadata);
      } catch (error) {
        // ? Do not leave a provisioned device marked as attached to a tenant where it does not exist
        await this.sdk.document
          .delete(
            this.config.platformIndex,
            InternalCollection.DEVICES,
            device._id,
            { refresh: "wait_for" },
          )
          .catch((rollbackError) =>
            this.logger.error(
              `Cannot roll back the provisioning of device "${device._id}": ${rollbackError.message}`,
            ),
          );

        throw error;
      }

      refreshableCollections.push({
        collection: InternalCollection.DEVICES,
        index: index,
      });
    }
    if (request.getRefresh() === "wait_for") {
      await Promise.all(
        refreshableCollections.map((target) =>
          this.sdk.collection.refresh(target.index, target.collection),
        ),
      );
    }

    return device;
  }
  private async _createDeviceProvisioning(
    device: KDocument<DeviceContent>,
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceProvisioningContent>> {
    const deviceProvisioning: KDocument<DeviceProvisioningContent> =
      await this.createDocument<DeviceProvisioningContent>(
        request,
        {
          _id: device._id,
          _source: {
            index: null,
            lastMeasuredAt: null,
            lastMeasures: [],
            measureSlots: device._source.measureSlots,
            model: device._source.model,
            provisionedAt: Date.now(),
            reference: device._source.reference,
          },
        },
        {
          collection: InternalCollection.DEVICES,
          index: this.config.platformIndex,
        },
      ).catch((error) => {
        if (error.id === "services.storage.document_already_exists") {
          throw new BadRequestError(`Device "${device._id}" already exists.`);
        }
        throw error;
      });

    return deviceProvisioning;
  }
  /**
   * Create a new device.
   *
   */
  async create(
    model: string,
    reference: string,
    metadata: JSONObject,
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceContent>> {
    this.checkReference(reference);
    const deviceId = DeviceSerializer.id(model, reference);

    const device = await lock(`device:${deviceId}`, async () =>
      this._create(deviceId, model, reference, metadata, request),
    );

    return device;
  }

  public async get(
    index: string,
    deviceId: string,
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceContent>> {
    return this.getDocument<DeviceContent>(request, deviceId, {
      collection: InternalCollection.DEVICES,
      index,
    });
  }
  /**
   * Replace a device metadata
   */
  public async replaceMetadata(
    index: string,
    deviceId: string,
    metadata: Metadata,
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceContent>> {
    return lock(`device:${deviceId}`, async () => {
      const device = await this.get(index, deviceId, request);

      for (const key in metadata) {
        if (key in device._source.metadata) {
          device._source.metadata[key] = metadata[key];
        }
      }

      const updatedPayload = await this.app.trigger<EventDeviceUpdateBefore>(
        "device-manager:device:update:before",
        { device: device, metadata },
      );

      const updatedDevice = await this.sdk.document.replace<DeviceContent>(
        index,
        InternalCollection.DEVICES,
        deviceId,
        updatedPayload.device._source,
      );

      await this.app.trigger<EventDeviceUpdateAfter>(
        "device-manager:device:update:after",
        {
          device: updatedDevice,
          metadata: updatedPayload.metadata,
        },
      );

      return updatedDevice;
    });
  }

  /**
   * Update the display name of a measure slot on a device
   */
  public async updateMeasureSlotDisplayName(
    index: string,
    deviceId: string,
    measureSlotName: string,
    displayName: { [locale: string]: string },
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceContent>> {
    return lock(`device:${deviceId}`, async () => {
      const device = await this.get(index, deviceId, request);

      const slot = device._source.measureSlots.find(
        (s) => s.name === measureSlotName,
      );
      if (!slot) {
        throw new BadRequestError(
          `Device ${deviceId} does not have a measure slot named ${measureSlotName}`,
        );
      }
      slot.displayName = displayName;

      const updatedDevice = await this.updateDocument<DeviceContent>(
        request,
        device,
        {
          collection: InternalCollection.DEVICES,
          index,
        },
      );
      return updatedDevice;
    });
  }

  /**
   * Update or Create an device metadata
   */
  public async upsert(
    index: string,
    model: string,
    reference: string,
    metadata: Metadata,
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceContent>> {
    this.checkReference(reference);
    const deviceId = DeviceSerializer.id(model, reference);

    return lock(`device:${deviceId}`, async () => {
      const deviceProvisioning = await this.get(
        this.config.platformIndex,
        deviceId,
        request,
      ).catch(() => null);

      if (!deviceProvisioning) {
        return this._create(deviceId, model, reference, metadata, request);
      }

      if (
        deviceProvisioning._source.index &&
        deviceProvisioning._source.index !== index
      ) {
        throw new BadRequestError(
          `Device "${deviceProvisioning._id}" already exists on another engine. Abort`,
        );
      }

      const engineDevice = await this.get(index, deviceId, request).catch(
        () => null,
      );

      if (!engineDevice) {
        await this._attachEngine(index, deviceId, request);
      }

      const updatedPayload = await this.app.trigger<EventDeviceUpdateBefore>(
        "device-manager:device:update:before",
        { device: deviceProvisioning, metadata },
      );

      const updatedDevice = await this.updateDocument<DeviceContent>(
        request,
        {
          _id: deviceId,
          _source: { metadata: updatedPayload.metadata },
        },
        {
          collection: InternalCollection.DEVICES,
          index,
        },
        { source: true },
      );

      await this.app.trigger<EventDeviceUpdateAfter>(
        "device-manager:device:update:after",
        {
          device: updatedDevice,
          metadata: updatedPayload.metadata,
        },
      );

      return updatedDevice;
    });
  }

  public async update(
    index: string,
    deviceId: string,
    metadata: Metadata,
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceContent>> {
    return lock(`device:${deviceId}`, async () => {
      const device = await this.get(index, deviceId, request);

      const updatedPayload = await this.app.trigger<EventDeviceUpdateBefore>(
        "device-manager:device:update:before",
        { device, metadata },
      );

      const updatedDevice = await this.updateDocument<DeviceContent>(
        request,
        {
          _id: deviceId,
          _source: { metadata: updatedPayload.metadata },
        },
        { collection: InternalCollection.DEVICES, index },
        { source: true },
      );

      await this.app.trigger<EventDeviceUpdateAfter>(
        "device-manager:device:update:after",
        {
          device: updatedDevice,
          metadata: updatedPayload.metadata,
        },
      );

      return updatedDevice;
    });
  }

  public async delete(index: string, deviceId: string, request: KuzzleRequest) {
    return lock<void>(`device:${deviceId}`, async () => {
      let device = await this.get(index, deviceId, request);

      // ? From the platform index, the device is also deleted from its tenant, if any
      if (index === this.config.platformIndex) {
        index = device._source.index;
        device = index
          ? await this.get(index, deviceId, request).catch(() => null)
          : null;
      }

      const promises = [];

      if (device?._source.linkedMeasures?.length) {
        const { successes: assets } =
          await this.sdk.document.mGet<AssetContent>(
            index,
            InternalCollection.ASSETS,
            device._source.linkedMeasures.map((link) => link.assetId),
          );

        for (const asset of assets) {
          const linkedDevices = asset._source.linkedMeasures.filter(
            (link) => link.deviceId !== device._id,
          );
          promises.push(
            lock(`asset:${index}:${asset._id}`, async () =>
              this.updateDocument<AssetContent>(
                request,
                {
                  _id: asset._id,
                  _source: { linkedMeasures: linkedDevices },
                },
                { collection: InternalCollection.ASSETS, index },
              ).then(async (updatedAsset) => {
                const event: AssetHistoryEventUnlink = {
                  name: "unlink",
                  unlink: {
                    deviceId,
                  },
                };

                await ask<AskAssetHistoryAdd<AssetHistoryEventUnlink>>(
                  "ask:device-manager:asset:history:add",
                  {
                    index,
                    histories: [
                      {
                        asset: updatedAsset._source,
                        event,
                        id: updatedAsset._id,
                        timestamp: Date.now(),
                      },
                    ],
                  },
                );
              }),
            ),
          );
        }
      }

      promises.push(
        this.deleteDocument(request, deviceId, {
          collection: InternalCollection.DEVICES,
          index: this.config.platformIndex,
        }),
      );

      if (device) {
        promises.push(
          this.deleteDocument(request, deviceId, {
            collection: InternalCollection.DEVICES,
            index,
          }),
        );
      }

      await Promise.all(promises);
    });
  }

  public async search(
    index: string,
    searchParams: SearchParams,
    request: KuzzleRequest,
  ): Promise<SearchResult<KHit<DeviceContent>>> {
    return this.searchDocument<DeviceContent>(request, searchParams, {
      collection: InternalCollection.DEVICES,
      index,
    });
  }

  public async unlinkAssets(
    deviceId: string,
    allMeasures: boolean,
    assetIds: string[],
    measureSlots: string[],
    request: KuzzleRequest,
  ): Promise<ApiDeviceUnlinkAssetsResult> {
    const index = request.getIndex();
    let device = await this.get(index, deviceId, request);
    const assets = [];

    // CASE ALL MEASURES TO UNLINK
    if (allMeasures) {
      const assetsToUnlink = device._source.linkedMeasures.map(
        (m) => m.assetId,
      );
      if (assetsToUnlink.length === 0) {
        throw new BadRequestError(
          `Device ${deviceId} has no measure to be unlinked`,
        );
      }
      for (const asset of assetsToUnlink) {
        const { asset: updatedAsset, device: updatedDevice } =
          await this.unlinkAssetDevice(deviceId, asset, [], true, request);
        assets.push(AssetSerializer.serialize(updatedAsset));
        device = DeviceSerializer.serialize(updatedDevice);
      }
      return { assets, device };
    }

    // CASE ALL MEASURES FROM SPECIFIC ASSETS TO UNLINK
    for (const asset of assetIds) {
      const { asset: updatedAsset, device: updatedDevice } =
        await this.unlinkAssetDevice(deviceId, asset, [], true, request);
      assets.push(AssetSerializer.serialize(updatedAsset));
      device = DeviceSerializer.serialize(updatedDevice);
    }

    // CASE SPECIFIC DEVICE SLOTS
    // FOR EVERY LINK THAT HAS A SLOT TO UNLINK
    for (const linkedMeasures of device._source.linkedMeasures.filter((l) =>
      l.measureSlots.some((s) => measureSlots.includes(s.device)),
    )) {
      const { asset: updatedAsset, device: updatedDevice } =
        await this.unlinkAssetDevice(
          deviceId,
          linkedMeasures.assetId,
          linkedMeasures.measureSlots.filter((slot) =>
            measureSlots.includes(slot.device),
          ),
          false,
          request,
        );
      assets.push(AssetSerializer.serialize(updatedAsset));
      device = DeviceSerializer.serialize(updatedDevice);
    }

    return { assets, device };
  }

  /**
   * Internal logic to attach the device to an engine
   *
   * @param index Engine id to attach to
   * @param deviceId Device id to attach
   * @param options.refresh Wait for ES indexation
   */
  private async _attachEngine(
    index: string,
    deviceId: string,
    request: KuzzleRequest,
    metadata?: JSONObject,
  ): Promise<KDocument<DeviceContent>> {
    const device = await this.getDeviceProvisioning(deviceId);

    if (device._source.index) {
      throw new BadRequestError(
        `Device "${device._id}" is already attached to an engine.`,
      );
    }

    await this.checkEngineExists(index);

    device._source.index = index;

    await this.updateDocument<DeviceContent>(request, device, {
      collection: InternalCollection.DEVICES,
      index: this.config.platformIndex,
    });

    // Make sure the device is cleaned when attached to tenant
    const engineDevice: KDocument<DeviceContent> = {
      _id: device._id,
      _source: {
        index,
        groups: [],
        linkedMeasures: [],
        measureSlots: device._source.measureSlots,
        metadata: {},
        model: device._source.model,
        reference: device._source.reference,
      },
    };
    const deviceModel = await this.getDeviceModel(engineDevice._source.model);
    // Initialize metadata
    for (const metadataName of Object.keys(
      deviceModel.device.metadataMappings,
    )) {
      engineDevice._source.metadata[metadataName] =
        metadata?.[metadataName] ??
        deviceModel.device.defaultMetadata[metadataName] ??
        null;
    }

    const updatedDevice = await this.createDocument<DeviceContent>(
      request,
      engineDevice,
      {
        collection: InternalCollection.DEVICES,
        index,
      },
    );

    if (request.getRefresh() === "wait_for") {
      await Promise.all([
        this.sdk.collection.refresh(
          this.config.platformIndex,
          InternalCollection.DEVICES,
        ),
        this.sdk.collection.refresh(
          device._source.index,
          InternalCollection.DEVICES,
        ),
      ]);
    }

    return updatedDevice;
  }

  /**
   * Attach the device to an engine
   *
   * @param index Engine id to attach to
   * @param deviceId Device id to attach
   * @param options.refresh Wait for ES indexation
   * @param options.strict If true, throw if an operation isn't possible
   */
  async attachEngine(
    index: string,
    deviceId: string,
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceContent>> {
    return lock(`device:${deviceId}`, async () =>
      this._attachEngine(index, deviceId, request),
    );
  }

  /**
   * Detach a device from its attached engine
   *
   * @param {string} deviceId Id of the device
   * @param {KuzzleRequest} request kuzzle request
   */
  async detachEngine(
    deviceId: string,
    request: KuzzleRequest,
    { checkRights = false }: { checkRights?: boolean } = {},
  ): Promise<KDocument<DeviceProvisioningContent>> {
    return lock(`device:${deviceId}`, async () => {
      const deviceProvisioning = await this.getDeviceProvisioning(deviceId);

      this.checkAttachedToEngine(deviceProvisioning);

      if (checkRights) {
        await this.checkEngineRights(deviceProvisioning._source.index, request);
      }

      const device = await this.sdk.document.get<DeviceContent>(
        deviceProvisioning._source.index,
        InternalCollection.DEVICES,
        deviceId,
      );
      if (device._source.linkedMeasures?.length) {
        await Promise.all(
          device._source.linkedMeasures.map((link) =>
            this.unlinkAssetDevice(deviceId, link.assetId, [], true, request),
          ),
        );
      }

      await Promise.all([
        this.updateDocument<DeviceProvisioningContent>(
          request,
          {
            _id: deviceProvisioning._id,
            _source: { index: null },
          },
          {
            collection: InternalCollection.DEVICES,
            index: this.config.platformIndex,
          },
        ),

        this.sdk.document.delete(
          deviceProvisioning._source.index,
          InternalCollection.DEVICES,
          deviceProvisioning._id,
        ),
      ]);

      if (request.getRefresh() === "wait_for") {
        await Promise.all([
          this.sdk.collection.refresh(
            this.config.platformIndex,
            InternalCollection.DEVICES,
          ),
          this.sdk.collection.refresh(
            deviceProvisioning._source.index,
            InternalCollection.DEVICES,
          ),
        ]);
      }

      return deviceProvisioning;
    });
  }

  async receiveMeasures(
    index: string,
    deviceId: string,
    measures: DecodedMeasurement[],
    payloadUuids: string[],
    request: KuzzleRequest,
  ) {
    const device = await this.get(index, deviceId, request);
    const deviceModel = await this.getDeviceModel(device._source.model);

    for (const measure of measures) {
      const declaredMeasure = deviceModel.device.measures.some(
        (m) => m.name === measure.measureName && m.type === measure.type,
      );

      if (!declaredMeasure) {
        throw new BadRequestError(
          `Measure "${measure.measureName}" is not declared for this device model.`,
        );
      }
    }

    await ask<AskPayloadReceiveFormated>(
      "ask:device-manager:payload:receive-formated",
      {
        device,
        measures,
        payloadUuids,
      },
    );
  }

  private async checkEngineExists(index: string) {
    const {
      result: { exists },
    } = await this.sdk.query({
      action: "exists",
      controller: "device-manager/engine",
      index: index,
    });

    if (!exists) {
      throw new BadRequestError(`Engine "${index}" does not exists.`);
    }
  }

  /**
   * Checks that the request user may run the request action on the given engine.
   *
   * Needed for actions without an index argument (e.g. detachEngine): Kuzzle
   * ignores the index restrictions of the user profiles for them.
   */
  private async checkEngineRights(index: string, request: KuzzleRequest) {
    const user = request.getUser();
    const controller = request.input.controller;
    const action = request.input.action;

    const allowed = await user?.isActionAllowed(
      new KuzzleRequest({ action, controller, index }),
    );

    if (!allowed) {
      throw new ForbiddenError(
        `Forbidden action [${index}/${controller}/${action}] for user ${user?._id}`,
      );
    }
  }

  /**
   * The reference is part of the device id, which is used in the API routes
   */
  private checkReference(reference: string) {
    if (reference.trim() === "") {
      throw new BadRequestError("The device reference must not be empty.");
    }

    if (/[\s/?#%\\]/.test(reference)) {
      throw new BadRequestError(
        `The device reference "${reference}" must not contain whitespaces or any of the characters / ? # % \\`,
      );
    }

    if (Buffer.byteLength(reference) > MAX_REFERENCE_BYTES) {
      throw new BadRequestError(
        `The device reference "${reference.slice(0, 32)}..." exceeds ${MAX_REFERENCE_BYTES} bytes.`,
      );
    }
  }

  private checkAttachedToEngine(device: KDocument<DeviceProvisioningContent>) {
    if (!device._source.index) {
      throw new BadRequestError(
        `Device "${device._id}" is not attached to an engine.`,
      );
    }
  }

  private async refreshModel({
    deviceModel,
  }: {
    deviceModel: DeviceModelContent;
  }): Promise<void> {
    const engines = await ask<AskEngineList>("ask:device-manager:engine:list", {
      tenantClass: null,
    });

    // ? Metadata are only added: a device keeps the metadata missing from its model
    const modelMetadata = {};

    for (const metadataName of Object.keys(
      deviceModel.device.metadataMappings ?? {},
    )) {
      modelMetadata[metadataName] =
        deviceModel.device.defaultMetadata?.[metadataName] ?? null;
    }

    for (const engine of engines) {
      // ? Scroll by pages matching the write limit, the default search size (10) would miss devices
      let result = await this.sdk.document.search<DeviceContent>(
        engine.index,
        InternalCollection.DEVICES,
        { query: { equals: { model: deviceModel.device.model } } },
        { lang: "koncorde", scroll: "10s", size: 200 },
      );

      while (result) {
        if (result.hits.length > 0) {
          await this.sdk.document.mReplace<DeviceContent>(
            engine.index,
            InternalCollection.DEVICES,
            result.hits.map((device) => ({
              _id: device._id,
              body: {
                ...device._source,
                measureSlots: deviceModel.device.measures,
                metadata: { ...modelMetadata, ...device._source.metadata },
              },
            })),
            { refresh: "wait_for" },
          );
        }

        result = await result.next();
      }
    }
  }
}
