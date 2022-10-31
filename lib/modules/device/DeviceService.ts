import {
  Backend,
  BadRequestError,
  JSONObject,
  KHit,
  Plugin,
  PluginContext,
  SearchResult,
} from "kuzzle";

import { Asset, AssetContent, LinkRequest, DeviceLink } from "./../asset";
import { InternalCollection, DeviceManagerConfiguration } from "../../core";
import { lock } from "../shared/utils/lock";
import { Metadata } from "../shared";
import { ask } from "../shared/utils/ask";
import { AskModelDeviceGet } from "../model/types/ModelEvents";

import { Device } from "./model/Device";
import { DeviceContent } from "./types/DeviceContent";
import { DeviceSerializer } from "./model/DeviceSerializer";
import {
  EventDeviceUpdateAfter,
  EventDeviceUpdateBefore,
} from "./types/DeviceEvents";

export class DeviceService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  private get app(): Backend {
    return global.app;
  }

  constructor(plugin: Plugin) {
    this.config = plugin.config as any;
    this.context = plugin.context;
  }

  /**
   * Create a new device.
   *
   * @todo creating a device in the "device-manager" index should be a separate
   * method since in this case "engineId" is not really an engine ID but still
   * required as an argument (in part to check the tenant rights)
   */
  async create(
    model: string,
    reference: string,
    metadata: JSONObject,
    {
      engineId,
      linkRequest,
      refresh,
    }: {
      engineId?: string;
      linkRequest?: LinkRequest;
      refresh?: any;
    } = {}
  ): Promise<Device> {
    let device = new Device(
      { measures: [], metadata, model, reference },
      DeviceSerializer.id(model, reference)
    );

    return lock(`device:create:${device._id}`, async () => {
      const deviceModel = await ask<AskModelDeviceGet>(
        "ask:device-manager:model:device:get",
        { model }
      );

      for (const metadataName of Object.keys(
        deviceModel.device.metadataMappings
      )) {
        device._source.metadata[metadataName] ||= null;
      }

      const refreshableCollections: Array<{
        index: string;
        collection: string;
      }> = [];

      const { _source } = await this.sdk.document.create<DeviceContent>(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        device._source,
        device._id
      );

      device._source = _source;

      refreshableCollections.push({
        collection: InternalCollection.DEVICES,
        index: this.config.adminIndex,
      });

      if (engineId && engineId !== this.config.adminIndex) {
        device = await this.attachEngine(engineId, device._id);

        refreshableCollections.push({
          collection: InternalCollection.DEVICES,
          index: engineId,
        });

        if (linkRequest.assetId) {
          const ret = await this.linkAsset(
            linkRequest.engineId,
            linkRequest.deviceId,
            linkRequest.assetId,
            linkRequest.measureNamesLinks
          );

          device = ret.device;

          refreshableCollections.push({
            collection: InternalCollection.ASSETS,
            index: engineId,
          });
        }
      }

      if (refresh) {
        await Promise.all(
          refreshableCollections.map(({ index, collection }) =>
            this.sdk.collection.refresh(index, collection)
          )
        );
      }

      return device;
    });
  }

  public async get(index: string, deviceId: string): Promise<Device> {
    const document = await this.sdk.document.get<DeviceContent>(
      index,
      InternalCollection.DEVICES,
      deviceId
    );

    return new Device(document._source, document._id);
  }

  public async update(
    engineId: string,
    deviceId: string,
    metadata: Metadata,
    { refresh }: { refresh: any }
  ): Promise<Device> {
    return lock<Device>(`device:update:${deviceId}`, async () => {
      const device = await this.get(engineId, deviceId);

      const updatedPayload = await this.app.trigger<EventDeviceUpdateBefore>(
        "device-manager:device:update:before",
        { device, metadata }
      );

      const { _source, _id } = await this.sdk.document.update<DeviceContent>(
        engineId,
        InternalCollection.DEVICES,
        deviceId,
        { metadata: updatedPayload.metadata },
        { refresh }
      );

      const updatedDevice = new Device(_source, _id);

      await this.app.trigger<EventDeviceUpdateAfter>(
        "device-manager:device:update:after",
        {
          device: updatedDevice,
          metadata: updatedPayload.metadata,
        }
      );

      return updatedDevice;
    });
  }

  public async delete(
    engineId: string,
    deviceId: string,
    { refresh }: { refresh: any }
  ) {
    return lock<void>(`device:delete:${deviceId}`, async () => {
      const device = await this.get(engineId, deviceId);

      const promises = [];

      if (device._source.assetId) {
        const asset = await this.sdk.document.get<AssetContent>(
          engineId,
          InternalCollection.ASSETS,
          device._source.assetId
        );

        const deviceLinks = asset._source.deviceLinks.filter(
          (link) => link.deviceId !== device._id
        );

        promises.push(
          // Potential race condition if someone update the asset deviceLinks
          // at the same time (e.g link or unlink asset)
          this.sdk.document.update<AssetContent>(
            engineId,
            InternalCollection.ASSETS,
            device._source.assetId,
            { deviceLinks },
            { refresh }
          )
        );
      }

      promises.push(
        this.sdk.document.delete(
          this.config.adminIndex,
          InternalCollection.DEVICES,
          deviceId,
          { refresh }
        )
      );

      promises.push(
        this.sdk.document.delete(
          engineId,
          InternalCollection.DEVICES,
          deviceId,
          { refresh }
        )
      );

      await Promise.all(promises);
    });
  }

  public async search(
    engineId: string,
    searchBody: JSONObject,
    {
      from,
      size,
      scroll,
      lang,
    }: { from?: number; size?: number; scroll?: string; lang?: string }
  ): Promise<SearchResult<KHit<DeviceContent>>> {
    const result = await this.sdk.document.search<DeviceContent>(
      engineId,
      InternalCollection.DEVICES,
      searchBody,
      { from, lang, scroll, size }
    );

    return result;
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
    { refresh }: { refresh?: any } = {}
  ): Promise<Device> {
    return lock(`device:attachEngine:${deviceId}`, async () => {
      const device = await this.get(this.config.adminIndex, deviceId);

      if (device._source.engineId) {
        throw new BadRequestError(
          `Device "${device._id}" is already attached to an engine.`
        );
      }

      await this.checkEngineExists(engineId);

      device._source.engineId = engineId;

      const [deviceDoc] = await Promise.all([
        this.sdk.document.update<DeviceContent>(
          this.config.adminIndex,
          InternalCollection.DEVICES,
          device._id,
          { engineId }
        ),

        this.sdk.document.create<DeviceContent>(
          device._source.engineId,
          InternalCollection.DEVICES,
          device._source,
          device._id
        ),
      ]);

      if (refresh) {
        await Promise.all([
          this.sdk.collection.refresh(
            this.config.adminIndex,
            InternalCollection.DEVICES
          ),
          this.sdk.collection.refresh(
            device._source.engineId,
            InternalCollection.DEVICES
          ),
        ]);
      }

      const updatedDevice = new Device(deviceDoc._source, deviceDoc._id);

      return updatedDevice;
    });
  }

  /**
   * Detach a device from its attached engine
   *
   * @param deviceId Device id
   * @param options.refresh Wait for ES indexation
   */
  async detachEngine(
    deviceId: string,
    { refresh }: { refresh?: any } = {}
  ): Promise<Device> {
    return lock(`device:detachEngine:${deviceId}`, async () => {
      const device = await this.get(this.config.adminIndex, deviceId);

      this.checkAttachedToEngine(device);

      if (device._source.assetId) {
        await this.unlinkAsset(deviceId, { refresh });
      }

      await Promise.all([
        this.sdk.document.update(
          this.config.adminIndex,
          InternalCollection.DEVICES,
          device._id,
          { engineId: null }
        ),

        this.sdk.document.delete(
          device._source.engineId,
          InternalCollection.DEVICES,
          device._id
        ),
      ]);

      if (refresh) {
        await Promise.all([
          this.sdk.collection.refresh(
            this.config.adminIndex,
            InternalCollection.DEVICES
          ),
          this.sdk.collection.refresh(
            device._source.engineId,
            InternalCollection.DEVICES
          ),
        ]);
      }

      return device;
    });
  }

  /**
   * Link a device to an asset.
   * If a match between `deviceMeasureName`s and `assetMeasureName`
   * isn't specified, it will be auto generated with the
   * `deviceMeasureNames` of the associated decoder
   *
   */
  async linkAsset(
    engineId: string,
    deviceId: string,
    assetId: string,
    measureNamesLinks: DeviceLink["measureNamesLinks"],
    { refresh }: { refresh?: any } = {}
  ): Promise<{ asset: Asset; device: Device }> {
    return lock(`device:linkAsset:${deviceId}`, async () => {
      const device = await this.get(this.config.adminIndex, deviceId);

      this.checkAttachedToEngine(device);

      if (device._source.engineId !== engineId) {
        throw new BadRequestError(
          `Device "${device._id}" is not attached to the specified engine.`
        );
      }

      if (device._source.assetId) {
        throw new BadRequestError(
          `Device "${device._id}" is already linked to an asset.`
        );
      }

      const assetDoc = await this.sdk.document.get<AssetContent>(
        device._source.engineId,
        InternalCollection.ASSETS,
        assetId
      );

      const asset = new Asset(assetDoc._source, assetDoc._id);

      device._source.assetId = assetId;
      asset._source.deviceLinks.push({ deviceId, measureNamesLinks });

      const [updatedDeviceDoc, , updatedAssetDoc] = await Promise.all([
        this.sdk.document.update<DeviceContent>(
          this.config.adminIndex,
          InternalCollection.DEVICES,
          device._id,
          { assetId }
        ),

        this.sdk.document.update<DeviceContent>(
          device._source.engineId,
          InternalCollection.DEVICES,
          device._id,
          { assetId }
        ),

        this.sdk.document.update<AssetContent>(
          device._source.engineId,
          InternalCollection.ASSETS,
          asset._id,
          { deviceLinks: asset._source.deviceLinks }
        ),
      ]);

      if (refresh) {
        await Promise.all([
          this.sdk.collection.refresh(
            this.config.adminIndex,
            InternalCollection.DEVICES
          ),
          this.sdk.collection.refresh(
            device._source.engineId,
            InternalCollection.DEVICES
          ),
          this.sdk.collection.refresh(
            device._source.engineId,
            InternalCollection.ASSETS
          ),
        ]);
      }

      const updatedAsset = new Asset(
        updatedAssetDoc._source,
        updatedAssetDoc._id
      );
      const updatedDevice = new Device(
        updatedDeviceDoc._source,
        updatedDeviceDoc._id
      );

      return { asset: updatedAsset, device: updatedDevice };
    });
  }

  /**
   * Unlink a device of an asset
   *
   * @param deviceId Id of the device
   * @param options.refresh Wait for ES indexation
   */
  async unlinkAsset(
    deviceId: string,
    { refresh }: { refresh?: any } = {}
  ): Promise<{ asset: Asset; device: Device }> {
    return lock(`device:unlinkAsset:${deviceId}`, async () => {
      const device = await this.get(this.config.adminIndex, deviceId);

      this.checkAttachedToEngine(device);

      if (!device._source.assetId) {
        throw new BadRequestError(
          `Device "${device._id}" is not linked to an asset.`
        );
      }

      const asset = await this.sdk.document.get<AssetContent>(
        device._source.engineId,
        InternalCollection.ASSETS,
        device._source.assetId
      );

      const deviceLinks = asset._source.deviceLinks.filter(
        (link) => link.deviceId !== device._id
      );

      const [deviceDoc, , assetDoc] = await Promise.all([
        this.sdk.document.update<DeviceContent>(
          this.config.adminIndex,
          InternalCollection.DEVICES,
          device._id,
          { assetId: null }
        ),

        this.sdk.document.update<DeviceContent>(
          device._source.engineId,
          InternalCollection.DEVICES,
          device._id,
          { assetId: null }
        ),

        this.sdk.document.update<AssetContent>(
          device._source.engineId,
          InternalCollection.ASSETS,
          asset._id,
          { deviceLinks }
        ),
      ]);

      if (refresh) {
        await Promise.all([
          this.sdk.collection.refresh(
            this.config.adminIndex,
            InternalCollection.DEVICES
          ),
          this.sdk.collection.refresh(
            device._source.engineId,
            InternalCollection.DEVICES
          ),
          this.sdk.collection.refresh(
            device._source.engineId,
            InternalCollection.ASSETS
          ),
        ]);
      }

      const updatedAsset = new Asset(assetDoc._source, assetDoc._id);
      const updatedDevice = new Device(deviceDoc._source, deviceDoc._id);

      return { asset: updatedAsset, device: updatedDevice };
    });
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

  private checkAttachedToEngine(device: Device) {
    if (!device._source.engineId) {
      throw new BadRequestError(
        `Device "${device._id}" is not attached to an engine.`
      );
    }
  }
}
