import {
  BadRequestError,
  ControllerDefinition,
  HttpStream,
  KuzzleRequest,
} from "kuzzle";
import _ from "lodash";
import { PassThrough } from "node:stream";

import { AssetSerializer } from "../asset/model/AssetSerializer";
import { MeasureExporter, DecodedMeasurement } from "../measure";
import { DeviceManagerPlugin } from "../plugin";

import { DeviceService } from "./DeviceService";
import { DeviceSerializer } from "./model/DeviceSerializer";
import {
  ApiDeviceAttachEngineResult,
  ApiDeviceCreateResult,
  ApiDeviceDeleteResult,
  ApiDeviceDetachEngineResult,
  ApiDeviceGetResult,
  ApiDeviceLinkAssetRequest,
  ApiDeviceLinkAssetResult,
  ApiDeviceSearchResult,
  ApiDeviceUnlinkAssetResult,
  ApiDeviceUpdateResult,
  ApiDeviceGetMeasuresResult,
} from "./types/DeviceApi";

export class DevicesController {
  public definition: ControllerDefinition;

  constructor(
    private plugin: DeviceManagerPlugin,
    private deviceService: DeviceService
  ) {
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
        getMeasures: {
          handler: this.getMeasures.bind(this),
          http: [
            {
              path: "device-manager/:engineId/devices/:_id/measures",
              verb: "get",
            },
            {
              path: "device-manager/:engineId/devices/:_id/measures",
              verb: "post",
            },
          ],
        },
        exportMeasures: {
          handler: this.exportMeasures.bind(this),
          http: [
            {
              path: "device-manager/:engineId/devices/:_id/measures/_export/:exportId",
              verb: "get",
            },
            {
              path: "device-manager/:engineId/devices/:_id/measures/_export",
              verb: "post",
            },
          ],
        },
        receiveMeasures: {
          handler: this.receiveMeasures.bind(this),
          http: [
            {
              path: "device-manager/:engineId/devices/:_id/measures",
              verb: "put",
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
    const metadata = request.getBodyObject("metadata");
    const refresh = request.getRefresh();

    const updatedDevice = await this.deviceService.update(
      request.getUser(),
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

    await this.deviceService.delete(request.getUser(), engineId, deviceId, {
      refresh,
    });
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
    const refresh = request.getRefresh();

    const device = await this.deviceService.create(
      request.getUser(),
      model,
      reference,
      metadata,
      {
        engineId,
        refresh,
      }
    );

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

    await this.deviceService.attachEngine(
      request.getUser(),
      engineId,
      deviceId,
      {
        refresh,
      }
    );
  }

  /**
   * Detach a device from it's tenant
   */
  async detachEngine(
    request: KuzzleRequest
  ): Promise<ApiDeviceDetachEngineResult> {
    const deviceId = request.getId();
    const refresh = request.getRefresh();

    await this.deviceService.detachEngine(request.getUser(), deviceId, {
      refresh,
    });
  }

  /**
   * Link a device to an asset.
   */
  async linkAsset(request: KuzzleRequest): Promise<ApiDeviceLinkAssetResult> {
    const deviceId = request.getId();
    const engineId = request.getString("engineId");
    const assetId = request.getString("assetId");
    const measureNames = request.getBodyArray(
      "measureNames",
      []
    ) as ApiDeviceLinkAssetRequest["body"]["measureNames"];
    const implicitMeasuresLinking = request.getBoolean(
      "implicitMeasuresLinking"
    );
    const refresh = request.getRefresh();

    if (measureNames.length === 0 && !implicitMeasuresLinking) {
      throw new BadRequestError(
        `You must provide at least one measure name or set "implicitMeasuresLinking" to true.`
      );
    }

    const { asset, device } = await this.deviceService.linkAsset(
      request.getUser(),
      engineId,
      deviceId,
      assetId,
      measureNames,
      { implicitMeasuresLinking, refresh }
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

    const { asset, device } = await this.deviceService.unlinkAsset(
      request.getUser(),
      deviceId,
      {
        refresh,
      }
    );

    return {
      asset: AssetSerializer.serialize(asset),
      device: DeviceSerializer.serialize(device),
    };
  }

  async getMeasures(
    request: KuzzleRequest
  ): Promise<ApiDeviceGetMeasuresResult> {
    const id = request.getId();
    const engineId = request.getString("engineId");
    const size = request.input.args.size;
    const from = request.input.args.from;
    const startAt = request.input.args.startAt
      ? request.getDate("startAt")
      : null;
    const endAt = request.input.args.endAt ? request.getDate("endAt") : null;
    const query = request.input.body?.query;
    const sort = request.input.body?.sort;
    const type = request.input.args.type;

    const exporter = new MeasureExporter(this.plugin, engineId, {
      target: "device",
    });

    const { measures, total } = await exporter.search(id, {
      endAt,
      from,
      query,
      size,
      sort,
      startAt,
      type,
    });

    return { measures, total };
  }

  async exportMeasures(request: KuzzleRequest) {
    const engineId = request.getString("engineId");

    if (
      request.context.connection.protocol === "http" &&
      request.context.connection.misc.verb === "GET"
    ) {
      const exportId = request.getString("exportId");

      const stream = new PassThrough();

      const exporter = new MeasureExporter(this.plugin, engineId);

      const { id } = await exporter.getExport(exportId);

      request.response.configure({
        headers: {
          "Content-Disposition": `attachment; filename="${id}.asset.csv"`,
          "Content-Type": "text/csv",
        },
      });

      exporter.sendExport(stream, exportId);

      return new HttpStream(stream);
    }

    const id = request.getId();
    const from = request.input.args.from;
    const startAt = request.input.args.startAt
      ? request.getDate("startAt")
      : null;
    const endAt = request.input.args.endAt ? request.getDate("endAt") : null;
    const query = request.input.body?.query;
    const sort = request.input.body?.sort;
    const type = request.input.args.type;

    const exporter = new MeasureExporter(this.plugin, engineId, {
      target: "device",
    });

    const { exportId } = await exporter.prepareExport(id, {
      endAt,
      from,
      query,
      sort,
      startAt,
      type,
    });

    return { exportId };
  }

  async receiveMeasures(request: KuzzleRequest) {
    const engineId = request.getString("engineId");
    const deviceId = request.getId();
    const measures = request.getBodyArray("measures") as DecodedMeasurement[];
    const payloadUuids = request.getBodyArray("payloadUuids", []);

    if (payloadUuids.length === 0) {
      payloadUuids.push(request.id);
    }

    for (let i = 0; i < measures.length; i++) {
      if (typeof measures[i].measureName !== "string") {
        throw new BadRequestError(
          `body.measures[${i}].measureName must be a string`
        );
      }

      if (typeof measures[i].measuredAt === "undefined") {
        measures[i].measuredAt = Date.now();
      } else if (typeof measures[i].measuredAt !== "number") {
        throw new BadRequestError(
          `body.measures[${i}].measuredAt must be a number`
        );
      }

      if (typeof measures[i].type !== "string") {
        throw new BadRequestError(`body.measures[${i}].type must be a string`);
      }

      if (!_.isPlainObject(measures[i].values)) {
        throw new BadRequestError(
          `body.measures[${i}].values must be an object`
        );
      }
    }

    await this.deviceService.receiveMeasures(
      engineId,
      deviceId,
      measures,
      payloadUuids
    );
  }
}
