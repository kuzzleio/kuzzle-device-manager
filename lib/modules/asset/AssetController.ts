import csv from "csvtojson";
import { BadRequestError, ControllerDefinition, KDocument, KuzzleRequest, Plugin, PluginContext } from "kuzzle";
import { CRUDController } from "kuzzle-plugin-commons";

import { MeasureService } from "../measure";
import { DeviceService } from "../device";

import { Asset } from "./Asset";
import { AssetService } from "./AssetService";
import { AssetContent, Metadata } from "./types/AssetContent";
import { InternalCollection } from "lib/InternalCollection";
import { AssetCreateResult, AssetDeleteResult, AssetGetResult, AssetSearchResult, AssetUpdateResult } from "./types/AssetRequests";
import { AssetSerializer } from "./AssetSerializer";
import { DeviceUnlinkAssetRequest } from "../device/types/DeviceRequests";

export class AssetController {
  private context: PluginContext;
  private definition: ControllerDefinition;
  private assetService: AssetService;
  private deviceService: DeviceService;
  private measureService: MeasureService;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  constructor(
    plugin: Plugin,
    assetService: AssetService,
    deviceService: DeviceService,
    measureService: MeasureService
  ) {
    this.assetService = assetService;
    this.deviceService = deviceService;
    this.measureService = measureService;

    /* eslint-disable sort-keys */
    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ path: "device-manager/:engineId/assets", verb: "post" }],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [
            { path: "device-manager/:engineId/assets/:_id", verb: "delete" },
          ],
        },
        get: {
          handler: this.get.bind(this),
          http: [{ path: "device-manager/:engineId/assets/:_id", verb: "get" }],
        },
        search: {
          handler: this.search.bind(this),
          http: [
            { path: "device-manager/:engineId/assets/_search", verb: "post" },
            { path: "device-manager/:engineId/assets/_search", verb: "get" },
          ],
        },
        update: {
          handler: this.update.bind(this),
          http: [{ path: "device-manager/:engineId/assets/:_id", verb: "put" }],
        },
        importAssets: {
          handler: this.importAssets.bind(this),
          http: [
            { path: "device-manager/:engineId/assets/_import", verb: "post" },
          ],
        },
        getMeasures: {
          handler: this.getMeasures.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assets/:_id/measures",
              verb: "get",
            },
          ],
        },
        pushMeasures: {
          handler: this.pushMeasures.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assets/:_id/measures",
              verb: "post",
            },
          ],
        },
        removeMeasures: {
          handler: this.removeMeasures.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assets/:_id/measures",
              verb: "delete",
            },
          ],
        },
      },
    };
    /* eslint-enable sort-keys */
  }

  async removeMeasures(request: KuzzleRequest) {
    const id = request.getId();
    const strict = request.getBoolean("strict");
    const engineId = request.getString("engineId");
    const assetMeasureNames = request.getBodyArray("assetMeasureNames");

    return this.assetService.removeMeasures(engineId, id, assetMeasureNames, {
      strict,
    });
  }

  async getMeasures(request: KuzzleRequest) {
    const id = request.getId();
    const engineId = request.getString("engineId");
    const size = request.input.args.size;
    const startAt = request.input.args.startAt;
    const endAt = request.input.args.endAt;
    if ((size && startAt) || (size && endAt)) {
      throw new BadRequestError(
        'You cannot specify both a "size" and a "startAt" or "endAt"'
      );
    }
    const measures = await this.assetService.measureHistory(engineId, id, {
      endAt,
      size,
      startAt,
    });

    return { measures };
  }

  async pushMeasures(request: KuzzleRequest) {
    const engineId = request.getString("engineId");
    const assetId = request.getId();
    const refresh = request.getRefresh();
    const strict = request.getBoolean("strict");
    const measures = request.getBodyArray("measures");
    const kuid = request.getKuid();

    const { asset, invalids, valids } =
      await this.measureService.registerByAsset(
        engineId,
        assetId,
        measures,
        kuid,
        { refresh, strict }
      );

    return { asset, engineId, invalids, valids };
  }

  async importAssets(request: KuzzleRequest) {
    const engineId = request.getString("engineId");
    const content = request.getBodyString("csv");

    const assets = await csv({ delimiter: "auto" }).fromString(content);

    const results = await this.assetService.importAssets(engineId, assets, {
      options: request.input.args,
      strict: true,
    });

    return results;
  }


  async get(request: KuzzleRequest): Promise<AssetGetResult> {
    const assetId = request.getId();
    const engineId = request.getString("engineId");

    const asset = await this.assetService.get(engineId, assetId);

    return AssetSerializer.serialize(asset);
  }

  async update(request: KuzzleRequest): Promise<AssetUpdateResult> {
    const assetId = request.getId();
    const engineId = request.getString("engineId");
    const metadata = request.getBody();
    const refresh = request.getRefresh();

    const updatedAsset = await this.assetService.update(engineId, assetId, metadata, {
      refresh,
    });

    return AssetSerializer.serialize(updatedAsset);
  }

  async create(request: KuzzleRequest): Promise<AssetCreateResult> {
    const engineId = request.getString("engineId");
    const model = request.getBodyString('model');
    const reference = request.getBodyString("reference");
    const metadata = request.getBodyObject("metadata", {});
    const refresh = request.getRefresh();

    const asset = await this.assetService.create(engineId, model, reference, metadata, {
      refresh,
    });

    return AssetSerializer.serialize(asset);
  }

  async delete(request: KuzzleRequest): Promise<AssetDeleteResult> {
    const engineId = request.getString("engineId");
    const assetId = request.getId();
    const refresh = request.getRefresh();
    const strict = request.getBoolean("strict");

    await this.assetService.delete(engineId, assetId, {
      refresh,
      strict,
    });
  }

  async search(request: KuzzleRequest): Promise<AssetSearchResult> {
    const engineId = request.getString("engineId");
    const {
      searchBody,
      from,
      size,
      scrollTTL: scroll,
    } = request.getSearchParams();
    const lang = request.getLangParam();

    const result = await this.assetService.search(engineId, searchBody, {
      from,
      size,
      scroll,
      lang,
    });

    return result;
  }
}
