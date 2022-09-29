import {
  Backend,
  BadRequestError,
  BatchController,
  JSONObject,
  Plugin,
  PluginContext,
} from "kuzzle";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

import { AttachRequest, LinkRequest, BaseAsset, AssetService } from './../asset';
import { MeasureContent } from './../measure';
import { DeviceManagerConfiguration } from './../engine';
import { InternalCollection } from "../../InternalCollection";
import { mRequest, mResponse, writeToDatabase } from "../../utils";
import { DecodersRegister } from "../measure";

import { Device } from './Device';
import { DeviceContent } from './types/DeviceContent';

export type DeviceBulkContent = {
  engineId: string;
  deviceId: string;
  assetId?: string;
};

export class DeviceService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private batch: BatchController;
  private assetService: AssetService;
  private decodersRegister: DecodersRegister;
  static eventId = "device-manager:device";

  private get sdk() {
    return this.context.accessors.sdk;
  }

  private get app(): Backend {
    return global.app;
  }

  constructor(
    plugin: Plugin,
    batchController: BatchController,
    assetService: AssetService,
    decoderRegister: DecodersRegister
  ) {
    this.config = plugin.config as any;
    this.context = plugin.context;
    this.assetService = assetService;
    this.decodersRegister = decoderRegister;

    this.batch = batchController;
  }

  /**
   * Create a new device.
   *
   * @param deviceContent Content of the device to create
   * @param {Object} options
   * @param options.engineId If it's not the admin engine,
   *  then the device will be attached to this one
   * @param options.measures Measures to be pushed to the device.
   *  They will be filtered by name and date like an update
   * @param options.linkRequest If specified, link to an asset
   * @param options.refresh Wait for ES indexation
   * @param options.strict If true, throw if an operation isn't possible
   */
  async create(
    deviceContent: DeviceContent,
    {
      engineId,
      measures,
      linkRequest,
      refresh,
      strict,
    }: {
      engineId?: string;
      measures?: MeasureContent[];
      linkRequest?: LinkRequest;
      refresh?: any;
      strict?: boolean;
    } = {}
  ): Promise<Device> {
    const device = new Device(
      deviceContent,
      Device.id(deviceContent.model, deviceContent.reference)
    );

    if (measures) {
      device.updateMeasures(measures);
    }

    let asset: BaseAsset;
    if (linkRequest) {
      try {
        asset = await this.assetService.get(engineId, linkRequest.assetId);
        device.linkToAsset(linkRequest);
        asset.linkToDevice(linkRequest);
      } catch (error) {
        if (strict) {
          throw error;
        }
      }
    }

    if (engineId && this.config.adminIndex !== engineId) {
      if (!(await this.tenantExists(engineId))) {
        if (strict) {
          throw new BadRequestError(`Engine "${engineId}" does not exists.`);
        }
      } else {
        device._source.engineId = engineId;

        await this.sdk.document.create(
          engineId,
          InternalCollection.DEVICES,
          device._source,
          device._id,
          { refresh }
        );
      }
    }

    await this.sdk.document.create(
      this.config.adminIndex,
      InternalCollection.DEVICES,
      device._source,
      device._id,
      { refresh }
    );

    if (asset) {
      await this.sdk.document.update(
        engineId,
        InternalCollection.ASSETS,
        asset._id,
        asset._source,
        { refresh }
      );
    }

    return device;
  }

  /**
   * Attach the device to an engine
   * @param {object} attachRequest
   * @param attachRequest.deviceId Device id to attach
   * @param attachRequest.engineId Engine id to attach to
   * @param {object} options
   * @param options.refresh Wait for ES indexation
   * @param options.strict If true, throw if an operation isn't possible
   */
  async attachEngine(
    { deviceId, engineId }: AttachRequest,
    { refresh, strict }: { refresh?: any; strict?: boolean }
  ): Promise<Device> {
    const eventId = `${DeviceService.eventId}:attach-engine`;
    const device = await this.getDevice(this.config, deviceId);

    if (!device) {
      throw new BadRequestError(`Device "${device._id}" does not exist.`);
    }

    if (strict && device._source.engineId) {
      throw new BadRequestError(
        `Device "${device._id}" is already attached to an engine.`
      );
    }

    if (!(await this.tenantExists(engineId))) {
      throw new BadRequestError(`Engine "${engineId}" does not exists.`);
    }

    device._source.engineId = engineId;

    const response = await this.app.trigger(`${eventId}:before`, { device });

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        response.device._id,
        { engineId: response.device._source.engineId },
        { refresh }
      ),

      this.sdk.document.createOrReplace(
        response.device._source.engineId,
        InternalCollection.DEVICES,
        response.device._id,
        response.device._source,
        { refresh }
      ),
    ]);

    await this.app.trigger(`${eventId}:after`, response);

    return device;
  }

  /**
   * Detach a device from its attached engine
   *
   * @param deviceId Device id
   * @param {object} options
   * @param options.refresh Wait for ES indexation
   * @param options.strict If true, throw if an operation isn't possible
   */
  async detachEngine(
    deviceId: string,
    { refresh, strict }: { refresh?: any; strict?: boolean }
  ): Promise<Device> {
    const eventId = `${DeviceService.eventId}:detach-engine`;
    const device = await this.getDevice(this.config, deviceId);

    const engineId = device._source.engineId;

    if (!device) {
      throw new BadRequestError(`Device "${device._id}" does not exist.`);
    }

    if (strict && !engineId) {
      throw new BadRequestError(
        `Device "${device._id}" is not attached to an engine.`
      );
    }

    if (device._source.assetId) {
      throw new BadRequestError(
        `Device "${device._id}" is still linked to an asset.`
      );
    }

    const response = await this.app.trigger(`${eventId}:before`, {
      device,
      engineId,
    });

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        response.device._id,
        { engineId: null },
        { refresh }
      ),

      this.sdk.document.delete(
        engineId,
        InternalCollection.DEVICES,
        response.device._id,
        { refresh }
      ),
    ]);

    await this.app.trigger(`${eventId}:after`, response);

    return device;
  }

  /**
   * Link a device to an asset.
   * If a match between `deviceMeasureName`s and `assetMeasureName`
   * isn't specified, it will be auto generated with the
   * `deviceMeasureNames` of the associated decoder
   *
   * @param linkRequest.assetId Asset id to link to
   * @param linkRequest.deviceLink The link with the device
   * @param options.refresh Wait for ES indexation
   * @param options.strict If true, throw if an operation isn't possible
   */
  async linkAsset(
    { assetId, deviceLink, engineId }: LinkRequest,
    { refresh }: { refresh?: any }
  ): Promise<{ asset: BaseAsset; device: Device }> {
    const eventId = `${DeviceService.eventId}:link-asset`;

    const device = await this.getDevice(this.config, deviceLink.deviceId);

    const deviceEngineId = device._source.engineId;

    if (!deviceEngineId) {
      throw new BadRequestError(
        `Device "${device._id}" is not attached to an engine.`
      );
    }

    if (deviceEngineId !== engineId) {
      throw new BadRequestError(
        `Device "${device._id}" is not attached to given engine.`
      );
    }

    if (device._source.assetId) {
      throw new BadRequestError(
        `Device "${device._id}" is already linked to an asset.`
      );
    }

    const asset = await this.assetService.get(deviceEngineId, assetId);

    if (!asset) {
      throw new BadRequestError(`Asset "${asset._id}" does not exist.`);
    }

    if (!deviceLink.measureNamesLinks.length) {
      const decoder = this.decodersRegister.get(device._source.model);

      deviceLink.measureNamesLinks = decoder.measureNames.map((name) => ({
        assetMeasureName: name,
        deviceMeasureName: name,
      }));
    }

    device.linkToAsset({ assetId, deviceLink, engineId });
    asset.linkToDevice({ assetId, deviceLink, engineId });

    const response = await this.app.trigger(`${eventId}:before`, {
      asset,
      device,
    });

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        device._id,
        { assetId: response.device._source.assetId },
        { refresh }
      ),

      this.sdk.document.update(
        deviceEngineId,
        InternalCollection.DEVICES,
        device._id,
        { assetId: response.device._source.assetId },
        { refresh }
      ),

      this.sdk.document.update(
        deviceEngineId,
        InternalCollection.ASSETS,
        asset._id,
        { deviceLinks: response.asset._source.deviceLinks },
        { refresh }
      ),
    ]);

    await this.app.trigger(`${eventId}:after`, response);

    return { asset, device };
  }

  /**
   * Unlink a device of an asset
   *
   * @param deviceId Id of the device
   * @param {object} options
   * @param options.refresh Wait for ES indexation
   * @param options.strict If true, throw if an operation isn't possible
   */
  async unlinkAsset(
    deviceId: string,
    { refresh, strict }: { refresh?: any; strict?: boolean }
  ): Promise<{ asset: BaseAsset; device: Device }> {
    const eventId = `${DeviceService.eventId}:unlink-asset`;
    const device = await this.getDevice(this.config, deviceId);

    if (!device) {
      throw new BadRequestError(`Device "${device._id}" does not exist.`);
    }

    const engineId = device._source.engineId;

    if (strict && !engineId) {
      throw new BadRequestError(
        `Device "${device._id}" is not attached to an engine.`
      );
    }

    if (!device._source.assetId) {
      throw new BadRequestError(
        `Device "${device._id}" is not linked to an asset.`
      );
    }

    const asset = await this.assetService.get(engineId, device._source.assetId);

    asset.unlinkDevice(device);
    device.unlinkToAsset();

    const response = await this.app.trigger(`${eventId}:before`, {
      asset,
      device,
    });

    await Promise.all([
      this.sdk.document.update(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        device._id,
        { assetId: response.device._source.assetId },
        { refresh }
      ),

      this.sdk.document.update(
        engineId,
        InternalCollection.DEVICES,
        device._id,
        { assetId: response.device._source.assetId },
        { refresh }
      ),

      this.sdk.document.update(
        engineId,
        InternalCollection.ASSETS,
        asset._id,
        {
          deviceLinks: response.asset._source.deviceLinks,
          measures: response.asset._source.measures,
        },
        { refresh }
      ),
    ]);

    await this.app.trigger(`${eventId}:after`, response);

    return { asset, device };
  }

  async importDevices(
    devices: JSONObject,
    { refresh, strict }: { refresh?: any; strict?: boolean }
  ) {
    const results = {
      errors: [],
      successes: [],
    };

    const deviceDocuments = devices.map((device: JSONObject) => ({
      _id: device._id || uuidv4(),
      body: _.omit(device, ["_id"]),
    }));

    await writeToDatabase(
      deviceDocuments,
      async (result: mRequest[]): Promise<mResponse> => {
        const created = await this.sdk.document.mCreate(
          "device-manager",
          "devices",
          result,
          { refresh, strict }
        );

        return {
          errors: results.errors.concat(created.errors),
          successes: results.successes.concat(created.successes),
        };
      }
    );

    return results;
  }

  async importCatalog(
    catalog: JSONObject[],
    { refresh, strict }: { refresh?: any; strict?: boolean }
  ): Promise<mResponse> {
    const results = {
      errors: [],
      successes: [],
    };

    const withoutIds = catalog.filter((content) => !content.deviceId);

    if (withoutIds.length > 0) {
      throw new BadRequestError(
        `${withoutIds.length} Devices do not have an ID`
      );
    }

    const catalogDocuments = catalog.map((catalogContent: JSONObject) => ({
      _id: `catalog--${catalogContent.deviceId}`,
      body: {
        catalog: {
          authorized: catalogContent.authorized === "false" ? false : true,
          deviceId: catalogContent.deviceId,
        },
        type: "catalog",
      },
    }));

    await writeToDatabase(
      catalogDocuments,
      async (result: mRequest[]): Promise<mResponse> => {
        const created = await this.sdk.document.mCreate(
          this.config.adminIndex,
          this.config.adminCollections.config.name,
          result,
          { refresh, strict }
        );

        return {
          errors: results.errors.concat(created.errors),
          successes: results.successes.concat(created.successes),
        };
      }
    );

    return results;
  }

  public async getDevice(
    config: DeviceManagerConfiguration,
    deviceId: string
  ): Promise<Device> {
    const document = await this.sdk.document.get(
      config.adminIndex,
      InternalCollection.DEVICES,
      deviceId
    );

    return new Device(document._source as DeviceContent, document._id);
  }

  private async tenantExists(engineId: string) {
    const { result: tenantExists } = await this.sdk.query({
      action: "exists",
      controller: "device-manager/engine",
      index: engineId,
    });

    return tenantExists;
  }
}
