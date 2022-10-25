import {
  BadRequestError,
  ControllerDefinition,
  JSONObject,
  KuzzleRequest,
  PluginImplementationError,
} from "kuzzle";

import { AssetSerializer } from "../asset/model/AssetSerializer";

import { DeviceService } from "./DeviceService";
import { DeviceSerializer } from "./model/DeviceSerializer";
import {
  ApiDeviceAttachEngineResult,
  ApiDeviceCreateResult,
  ApiDeviceDeleteResult,
  ApiDeviceDetachEngineResult,
  ApiDeviceGetResult,
  ApiDeviceLinkAssetResult,
  ApiDeviceSearchResult,
  ApiDeviceUnlinkAssetResult,
  ApiDeviceUpdateResult,
} from "./types/DeviceApi";

export class DeviceController {
  public definition: ControllerDefinition;

  private deviceService: DeviceService;

  constructor(deviceService: DeviceService) {
    this.deviceService = deviceService;

    /* eslint-disable sort-keys */
    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ path: "device-manager/:engineId/devices", verb: "post" }],
        },
        get: {
          handler: this.get.bind(this),
          http: [
            { path: "device-manager/:engineId/devices/:_id", verb: "get" },
          ],
        },
        update: {
          handler: this.update.bind(this),
          http: [
            { path: "device-manager/:engineId/device/:deviceId", verb: "post" },
          ],
        },
        search: {
          handler: this.search.bind(this),
          http: [
            { path: "device-manager/:engineId/devices/_search", verb: "post" },
          ],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [
            {
              path: "device-manager/:engineId/device/:deviceId",
              verb: "delete",
            },
          ],
        },
        attachEngine: {
          handler: this.attachEngine.bind(this),
          http: [
            {
              path: "device-manager/:engineId/devices/:_id/_attach",
              verb: "put",
            },
          ],
        },
        detachEngine: {
          handler: this.detachEngine.bind(this),
          http: [
            { path: "device-manager/devices/:_id/_detach", verb: "delete" },
          ],
        },
        linkAsset: {
          handler: this.linkAsset.bind(this),
          http: [
            {
              path: "device-manager/:engineId/devices/:_id/_link/:assetId",
              verb: "put",
            },
          ],
        },
        unlinkAsset: {
          handler: this.unlinkAsset.bind(this),
          http: [
            {
              path: "device-manager/:engineId/devices/:_id/_unlink",
              verb: "delete",
            },
          ],
        },
      },
    };
    /* eslint-enable sort-keys */
  }

  async get(request: KuzzleRequest): Promise<ApiDeviceGetResult> {
    const deviceId = request.getId();
    const engineId = request.getString("engineId");

    const device = await this.deviceService.get(engineId, deviceId);

    return DeviceSerializer.serialize(device);
  }

  async update(request: KuzzleRequest): Promise<ApiDeviceUpdateResult> {
    const deviceId = request.getId();
    const engineId = request.getString("engineId");
    const metadata = request.getBody();
    const refresh = request.getRefresh();

    const updatedDevice = await this.deviceService.update(
      engineId,
      deviceId,
      metadata,
      {
        refresh,
      }
    );

    return DeviceSerializer.serialize(updatedDevice);
  }

  async delete(request: KuzzleRequest): Promise<ApiDeviceDeleteResult> {
    const engineId = request.getString("engineId");
    const deviceId = request.getId();
    const refresh = request.getRefresh();

    await this.deviceService.delete(engineId, deviceId, { refresh });
  }

  async search(request: KuzzleRequest): Promise<ApiDeviceSearchResult> {
    const engineId = request.getString("engineId");
    const {
      searchBody,
      from,
      size,
      scrollTTL: scroll,
    } = request.getSearchParams();
    const lang = request.getLangParam();

    const result = await this.deviceService.search(engineId, searchBody, {
      from,
      lang,
      scroll,
      size,
    });

    return result;
  }

  /**
   * Create and provision a new device
   */
  async create(request: KuzzleRequest): Promise<ApiDeviceCreateResult> {
    const engineId = request.getString("engineId");
    const model = request.getBodyString("model");
    const reference = request.getBodyString("reference");
    const metadata = request.getBodyObject("metadata", {});
    const assetId = request.input.body.assetId;
    const measureNamesLinks = request.getBodyArray("measureNamesLinks", []);
    const refresh = request.getRefresh();

    if (assetId) {
      this.validateMeasureNamesLinks(measureNamesLinks);
    }

    if (assetId && !assetId.length && measureNamesLinks.length === 0) {
      throw new PluginImplementationError(
        "A link request is given without any assetId"
      );
    }

    const device = await this.deviceService.create(model, reference, metadata, {
      engineId,
      linkRequest: {
        assetId,
        deviceId: DeviceSerializer.id(model, reference),
        engineId,
        measureNamesLinks,
      },
      refresh,
    });

    return DeviceSerializer.serialize(device);
  }

  /**
   * Attach a device to a tenant
   */
  async attachEngine(
    request: KuzzleRequest
  ): Promise<ApiDeviceAttachEngineResult> {
    const engineId = request.getString("engineId");
    const deviceId = request.getId();
    const refresh = request.getRefresh();

    await this.deviceService.attachEngine(engineId, deviceId, {
      refresh,
    });
  }

  /**
   * Detach a device from it's tenant
   */
  async detachEngine(
    request: KuzzleRequest
  ): Promise<ApiDeviceDetachEngineResult> {
    const deviceId = request.getId();
    const refresh = request.getRefresh();

    await this.deviceService.detachEngine(deviceId, { refresh });
  }

  /**
   * Link a device to an asset.
   */
  async linkAsset(request: KuzzleRequest): Promise<ApiDeviceLinkAssetResult> {
    const deviceId = request.getId();
    const engineId = request.getString("engineId");
    const assetId = request.getString("assetId");
    const refresh = request.getRefresh();
    const measureNamesLinks = request.getBodyArray("measureNamesLinks");

    this.validateMeasureNamesLinks(measureNamesLinks);

    const { asset, device } = await this.deviceService.linkAsset(
      engineId,
      deviceId,
      assetId,
      measureNamesLinks,
      { refresh }
    );

    return {
      asset: AssetSerializer.serialize(asset),
      device: DeviceSerializer.serialize(device),
    };
  }

  /**
   * Unlink a device from an asset.
   */
  async unlinkAsset(
    request: KuzzleRequest
  ): Promise<ApiDeviceUnlinkAssetResult> {
    const deviceId = request.getId();
    const refresh = request.getRefresh();

    const { asset, device } = await this.deviceService.unlinkAsset(deviceId, {
      refresh,
    });

    return {
      asset: AssetSerializer.serialize(asset),
      device: DeviceSerializer.serialize(device),
    };
  }

  private validateMeasureNamesLinks(measureNamesLinks: JSONObject) {
    if (measureNamesLinks.length === 0) {
      throw new BadRequestError(
        `Measures name mappings is empty ("measureNamesLinks")`
      );
    }

    for (let i = 0; i < measureNamesLinks.length; i++) {
      if (!measureNamesLinks[i].assetMeasureName) {
        throw new BadRequestError(
          `Missing "measureNamesLinks[${i}].assetMeasureName"`
        );
      }
      if (!measureNamesLinks[i].deviceMeasureName) {
        throw new BadRequestError(
          `Missing "measureNamesLinks[${i}].deviceMeasureName"`
        );
      }
    }
  }
}
