import {
  Backend,
  BadRequestError,
  JSONObject,
  KDocument,
  KHit,
  Plugin,
  PluginContext,
  SearchResult,
} from "kuzzle";

import { AskAssetHistoryAdd, AssetContent, AssetHistoryEventLink, AssetHistoryEventUnlink } from "./../asset";
import { InternalCollection, DeviceManagerConfiguration } from "../../core";
import { Metadata, lock, ask } from "../shared";
import { AskModelDeviceGet } from "../model";

import { DeviceContent } from "./types/DeviceContent";
import { DeviceSerializer } from "./model/DeviceSerializer";
import {
  EventDeviceUpdateAfter,
  EventDeviceUpdateBefore,
} from "./types/DeviceEvents";
import { ApiDeviceLinkAssetRequest } from "./exports";

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
      refresh,
    }: {
      engineId?: string;
      refresh?: any;
    } = {}
  ): Promise<KDocument<DeviceContent>> {
    let device: KDocument<DeviceContent> = {
      _id: DeviceSerializer.id(model, reference),
      _source: {
        measures: {},
        metadata,
        model,
        reference,
      },
    };

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

  public async get(
    index: string,
    deviceId: string
  ): Promise<KDocument<DeviceContent>> {
    const device = await this.sdk.document.get<DeviceContent>(
      index,
      InternalCollection.DEVICES,
      deviceId
    );

    return device;
  }

  public async update(
    engineId: string,
    deviceId: string,
    metadata: Metadata,
    { refresh }: { refresh: any }
  ): Promise<KDocument<DeviceContent>> {
    return lock<KDocument<DeviceContent>>(
      `device:update:${deviceId}`,
      async () => {
        const device = await this.get(engineId, deviceId);

        const updatedPayload = await this.app.trigger<EventDeviceUpdateBefore>(
          "device-manager:device:update:before",
          { device, metadata }
        );

        const updatedDevice = await this.sdk.document.update<DeviceContent>(
          engineId,
          InternalCollection.DEVICES,
          deviceId,
          { metadata: updatedPayload.metadata },
          { refresh, source: true }
        );

        await this.app.trigger<EventDeviceUpdateAfter>(
          "device-manager:device:update:after",
          {
            device: updatedDevice,
            metadata: updatedPayload.metadata,
          }
        );

        return updatedDevice;
      }
    );
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

        const linkedDevices = asset._source.linkedDevices.filter(
          (link) => link._id !== device._id
        );

        promises.push(
          // Potential race condition if someone update the asset linkedDevices
          // at the same time (e.g link or unlink asset)
          this.sdk.document.update<AssetContent>(
            engineId,
            InternalCollection.ASSETS,
            device._source.assetId,
            { linkedDevices },
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
  ): Promise<KDocument<DeviceContent>> {
    return lock(`device:attachEngine:${deviceId}`, async () => {
      const device = await this.get(this.config.adminIndex, deviceId);

      if (device._source.engineId) {
        throw new BadRequestError(
          `Device "${device._id}" is already attached to an engine.`
        );
      }

      await this.checkEngineExists(engineId);

      device._source.engineId = engineId;

      const [updatedDevice] = await Promise.all([
        this.sdk.document.update<DeviceContent>(
          this.config.adminIndex,
          InternalCollection.DEVICES,
          device._id,
          { engineId },
          { source: true }
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
  ): Promise<KDocument<DeviceContent>> {
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
   */
  async linkAsset(
    engineId: string,
    deviceId: string,
    assetId: string,
    measureNames: ApiDeviceLinkAssetRequest["body"]["measureNames"],
    { refresh }: { refresh?: any } = {}
  ): Promise<{
    asset: KDocument<AssetContent>;
    device: KDocument<DeviceContent>;
  }> {
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

      const asset = await this.sdk.document.get<AssetContent>(
        device._source.engineId,
        InternalCollection.ASSETS,
        assetId
      );

      this.checkAssetMeasureNamesAvailability(asset, measureNames);

      device._source.assetId = assetId;
      asset._source.linkedDevices.push({
        _id: deviceId,
        measureNames,
      });

      const [updatedDevice, , updatedAsset] = await Promise.all([
        this.sdk.document.update<DeviceContent>(
          this.config.adminIndex,
          InternalCollection.DEVICES,
          device._id,
          { assetId },
          { source: true }
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
          { linkedDevices: asset._source.linkedDevices },
          { source: true }
        ),
      ]);

      const event: AssetHistoryEventLink = {
        name: "link",
        link: {
          deviceId: device._id
        }
      };
      await ask<AskAssetHistoryAdd<AssetHistoryEventLink>>(
        "ask:device-manager:asset:history:add",
        { engineId, event, asset: updatedAsset });

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

      return { asset: updatedAsset, device: updatedDevice };
    });
  }

  /**
   * Checks if the asset does not already have a linked device using one of the
   * requested measure names.
   */
  private checkAssetMeasureNamesAvailability(
    asset: KDocument<AssetContent>,
    measureNames: ApiDeviceLinkAssetRequest["body"]["measureNames"]
  ) {
    const requestedMeasuresNames = measureNames.map((m) => m.asset);

    for (const link of asset._source.linkedDevices) {
      const existingMeasureNames = link.measureNames.map((m) => m.asset);

      for (const requestedMeasuresName of requestedMeasuresNames) {
        if (existingMeasureNames.includes(requestedMeasuresName)) {
          throw new BadRequestError(
            `Measure name "${requestedMeasuresName}" is already used by another device on this asset.`
          );
        }
      }
    }
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
  ): Promise<{
    asset: KDocument<AssetContent>;
    device: KDocument<DeviceContent>;
  }> {
    return lock(`device:unlinkAsset:${deviceId}`, async () => {
      const device = await this.get(this.config.adminIndex, deviceId);
      const engineId = device._source.engineId;

      this.checkAttachedToEngine(device);

      if (!device._source.assetId) {
        throw new BadRequestError(
          `Device "${device._id}" is not linked to an asset.`
        );
      }

      const asset = await this.sdk.document.get<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        device._source.assetId
      );

      const linkedDevices = asset._source.linkedDevices.filter(
        (link) => link._id !== device._id
      );

      const [updatedDevice, , updatedAsset] = await Promise.all([
        this.sdk.document.update<DeviceContent>(
          this.config.adminIndex,
          InternalCollection.DEVICES,
          device._id,
          { assetId: null },
          { source: true }
        ),

        this.sdk.document.update<DeviceContent>(
          engineId,
          InternalCollection.DEVICES,
          device._id,
          { assetId: null }
        ),

        this.sdk.document.update<AssetContent>(
          engineId,
          InternalCollection.ASSETS,
          asset._id,
          { linkedDevices },
          { source: true }
        ),
      ]);

      const event: AssetHistoryEventUnlink = {
        name: "unlink",
        unlink: {
          deviceId
        }
      };
      await ask<AskAssetHistoryAdd<AssetHistoryEventUnlink>>(
        "ask:device-manager:asset:history:add",
        { engineId, event, asset: updatedAsset });

      if (refresh) {
        await Promise.all([
          this.sdk.collection.refresh(
            this.config.adminIndex,
            InternalCollection.DEVICES
          ),
          this.sdk.collection.refresh(
            engineId,
            InternalCollection.DEVICES
          ),
          this.sdk.collection.refresh(
            engineId,
            InternalCollection.ASSETS
          ),
        ]);
      }

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

  private checkAttachedToEngine(device: KDocument<DeviceContent>) {
    if (!device._source.engineId) {
      throw new BadRequestError(
        `Device "${device._id}" is not attached to an engine.`
      );
    }
  }
}
