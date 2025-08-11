import { BadRequestError, KuzzleRequest } from "kuzzle";
import { ask, onAsk } from "kuzzle-plugin-commons";
import {
  BaseRequest,
  DocumentSearchResult,
  JSONObject,
  KDocument,
  KHit,
  SearchResult,
} from "kuzzle-sdk";

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
} from "./../asset";

import { AskPayloadReceiveFormated } from "../decoder/types/PayloadEvents";
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

export class DeviceService extends DigitalTwinService {
  constructor(plugin: DeviceManagerPlugin) {
    super(plugin, InternalCollection.DEVICES);
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
      async ({ deviceId, engineId, user }) => {
        const request = new KuzzleRequest({ refresh: "false" }, { user });
        await this.attachEngine(engineId, deviceId, request);
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
        associatedAt: 0, // Will be set when attached to an engine
        engineId: null,
        groups: [],
        linkedMeasures: [],
        measureSlots: [],
        metadata,
        model,
        reference,
      },
    };

    const deviceModel = await this.getDeviceModel(model);
    const engineId = request.getString("engineId");

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
    if (engineId && engineId !== this.config.platformIndex) {
      device = await this._attachEngine(
        engineId,
        device._id,
        request,
        metadata,
      );

      refreshableCollections.push({
        collection: InternalCollection.DEVICES,
        index: engineId,
      });
    }
    if (request.getRefresh() === "wait_for") {
      await Promise.all(
        refreshableCollections.map(({ index, collection }) =>
          this.sdk.collection.refresh(index, collection),
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
            engineId: device._source.engineId,
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
          engineId: this.config.platformIndex,
        },
      );

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
    const deviceId = DeviceSerializer.id(model, reference);

    const device = await lock(`device:${deviceId}`, async () =>
      this._create(deviceId, model, reference, metadata, request),
    );

    return device;
  }

  public async get(
    engineId: string,
    deviceId: string,
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceContent>> {
    return this.getDocument<DeviceContent>(request, deviceId, {
      collection: InternalCollection.DEVICES,
      engineId,
    });
  }
  /**
   * Replace a device metadata
   */
  public async replaceMetadata(
    engineId: string,
    deviceId: string,
    metadata: Metadata,
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceContent>> {
    return lock(`device:${deviceId}`, async () => {
      const device = await this.get(engineId, deviceId, request);

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
        engineId,
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
   * Update or Create an device metadata
   */
  public async upsert(
    engineId: string,
    model: string,
    reference: string,
    metadata: Metadata,
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceContent>> {
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
        deviceProvisioning._source.engineId &&
        deviceProvisioning._source.engineId !== engineId
      ) {
        throw new BadRequestError(
          `Device "${deviceProvisioning._id}" already exists on another engine. Abort`,
        );
      }

      const engineDevice = await this.get(engineId, deviceId, request).catch(
        () => null,
      );

      if (!engineDevice) {
        await this._attachEngine(engineId, deviceId, request);
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
          engineId,
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
    engineId: string,
    deviceId: string,
    metadata: Metadata,
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceContent>> {
    return lock(`device:${deviceId}`, async () => {
      const device = await this.get(engineId, deviceId, request);

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
        { collection: InternalCollection.DEVICES, engineId },
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

  public async delete(
    engineId: string,
    deviceId: string,
    request: KuzzleRequest,
  ) {
    return lock<void>(`device:${deviceId}`, async () => {
      const device = await this.get(engineId, deviceId, request);

      const promises = [];

      if (device._source.linkedMeasures?.length) {
        const { successes: assets } =
          await this.sdk.document.mGet<AssetContent>(
            engineId,
            InternalCollection.ASSETS,
            device._source.linkedMeasures.map((link) => link.assetId),
          );

        for (const asset of assets) {
          const linkedDevices = asset._source.linkedMeasures.filter(
            (link) => link.deviceId !== device._id,
          );
          promises.push(
            // Potential race condition if someone update the asset linkedDevices
            // at the same time (e.g link or unlink asset)
            this.updateDocument<AssetContent>(
              request,
              {
                _id: asset._id,
                _source: { linkedMeasures: linkedDevices },
              },
              { collection: InternalCollection.ASSETS, engineId },
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
                  engineId,
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
          );
        }
      }

      promises.push(
        this.deleteDocument(request, deviceId, {
          collection: InternalCollection.DEVICES,
          engineId: this.config.platformIndex,
        }),
      );

      promises.push(
        this.deleteDocument(request, deviceId, {
          collection: InternalCollection.DEVICES,
          engineId,
        }),
      );

      await Promise.all(promises);
    });
  }

  public async search(
    engineId: string,
    searchParams: SearchParams,
    request: KuzzleRequest,
  ): Promise<SearchResult<KHit<DeviceContent>>> {
    return this.searchDocument<DeviceContent>(request, searchParams, {
      collection: InternalCollection.DEVICES,
      engineId,
    });
  }

  /**
   * Internal logic to attach the device to an engine
   *
   * @param engineId Engine id to attach to
   * @param deviceId Device id to attach
   * @param options.refresh Wait for ES indexation
   */
  private async _attachEngine(
    engineId: string,
    deviceId: string,
    request: KuzzleRequest,
    metadata?: JSONObject,
  ): Promise<KDocument<DeviceContent>> {
    const device = await this.getDeviceProvisioning(deviceId);

    if (device._source.engineId) {
      throw new BadRequestError(
        `Device "${device._id}" is already attached to an engine.`,
      );
    }

    await this.checkEngineExists(engineId);

    device._source.engineId = engineId;

    await this.updateDocument<DeviceContent>(request, device, {
      collection: InternalCollection.DEVICES,
      engineId: this.config.platformIndex,
    });

    // Make sure the device is cleaned when attached to tenant
    const engineDevice: KDocument<DeviceContent> = {
      _id: device._id,
      _source: {
        associatedAt: Date.now(),
        engineId,
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
        metadata?.[metadataName] ||
        deviceModel.device.defaultMetadata[metadataName] ||
        null;
    }

    const updatedDevice = await this.createDocument<DeviceContent>(
      request,
      engineDevice,
      {
        collection: InternalCollection.DEVICES,
        engineId,
      },
    );

    if (request.getRefresh() === "wait_for") {
      await Promise.all([
        this.sdk.collection.refresh(
          this.config.platformIndex,
          InternalCollection.DEVICES,
        ),
        this.sdk.collection.refresh(
          device._source.engineId,
          InternalCollection.DEVICES,
        ),
      ]);
    }

    return updatedDevice;
  }

  /**
   * Attach the device to an engine
   *
   * @param engineId Engine id to attach to
   * @param deviceId Device id to attach
   * @param options.refresh Wait for ES indexation
   * @param options.strict If true, throw if an operation isn't possible
   */
  async attachEngine(
    engineId: string,
    deviceId: string,
    request: KuzzleRequest,
  ): Promise<KDocument<DeviceContent>> {
    return lock(`device:${deviceId}`, async () =>
      this._attachEngine(engineId, deviceId, request),
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
  ): Promise<KDocument<DeviceProvisioningContent>> {
    return lock(`device:${deviceId}`, async () => {
      const deviceProvisioning = await this.getDeviceProvisioning(deviceId);

      this.checkAttachedToEngine(deviceProvisioning);

      const device = await this.sdk.document.get<DeviceContent>(
        deviceProvisioning._source.engineId,
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
            _source: { engineId: null },
          },
          {
            collection: InternalCollection.DEVICES,
            engineId: this.config.platformIndex,
          },
        ),

        this.sdk.document.delete(
          deviceProvisioning._source.engineId,
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
            deviceProvisioning._source.engineId,
            InternalCollection.DEVICES,
          ),
        ]);
      }

      return deviceProvisioning;
    });
  }

  async receiveMeasures(
    engineId: string,
    deviceId: string,
    measures: DecodedMeasurement[],
    payloadUuids: string[],
    request: KuzzleRequest,
  ) {
    const device = await this.get(engineId, deviceId, request);
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

  private async checkEngineExists(engineId: string) {
    const {
      result: { exists },
    } = await this.sdk.query({
      action: "exists",
      controller: "device-manager/engine",
      index: engineId,
    });

    if (!exists) {
      throw new BadRequestError(`Engine "${engineId}" does not exists.`);
    }
  }

  private checkAttachedToEngine(device: KDocument<DeviceProvisioningContent>) {
    if (!device._source.engineId) {
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
      group: null,
    });

    const targets = engines.map((engine) => ({
      collections: [InternalCollection.DEVICES],
      index: engine.index,
    }));

    const devices = await this.sdk.query<
      BaseRequest,
      DocumentSearchResult<DeviceContent>
    >({
      action: "search",
      body: { query: { equals: { model: deviceModel.device.model } } },
      controller: "document",
      lang: "koncorde",
      targets,
    });

    const updatedDevicesPerIndex: Record<string, KDocument<DeviceContent>[]> =
      devices.result.hits.reduce(
        (
          acc: Record<string, KDocument<DeviceContent>[]>,
          device: JSONObject,
        ) => {
          device._source.measureSlots = deviceModel.device.measures;

          acc[device.index].push(device as KDocument<DeviceContent>);

          return acc;
        },
        Object.fromEntries(
          engines.map((engine) => [
            engine.index,
            [] as KDocument<DeviceContent>[],
          ]),
        ),
      );

    await Promise.all(
      Object.entries(updatedDevicesPerIndex).map(([index, updatedDevices]) =>
        this.sdk.document.mReplace<DeviceContent>(
          index,
          InternalCollection.DEVICES,
          updatedDevices.map((device) => ({
            _id: device._id,
            body: device._source,
          })),
          { refresh: "wait_for" },
        ),
      ),
    );
  }
}
