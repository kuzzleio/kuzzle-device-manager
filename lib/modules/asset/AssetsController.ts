import { ControllerDefinition, HttpStream, KuzzleRequest } from "kuzzle";
import { PassThrough } from "stream";

import { MeasureExporter } from "../measure/";
import { DeviceManagerPlugin } from "../plugin";

import { AssetService } from "./AssetService";
import { AssetSerializer } from "./model/AssetSerializer";
import {
  ApiAssetCreateResult,
  ApiAssetDeleteResult,
  ApiAssetGetMeasuresResult,
  ApiAssetGetResult,
  ApiAssetSearchResult,
  ApiAssetUpdateResult,
} from "./types/AssetApi";

export class AssetsController {
  public definition: ControllerDefinition;

  constructor(
    private plugin: DeviceManagerPlugin,
    private assetService: AssetService
  ) {
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
        getMeasures: {
          handler: this.getMeasures.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assets/:_id/measures",
              verb: "get",
            },
            {
              path: "device-manager/:engineId/assets/:_id/measures",
              verb: "post",
            },
          ],
        },
        exportMeasures: {
          handler: this.exportMeasures.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assets/:_id/measures/_export/:exportId",
              verb: "get",
            },
            {
              path: "device-manager/:engineId/assets/:_id/measures/_export",
              verb: "post",
            },
          ],
        },
      },
    };
    /* eslint-enable sort-keys */
  }

  async get(request: KuzzleRequest): Promise<ApiAssetGetResult> {
    const assetId = request.getId();
    const engineId = request.getString("engineId");

    const asset = await this.assetService.get(engineId, assetId);

    return AssetSerializer.serialize(asset);
  }

  async update(request: KuzzleRequest): Promise<ApiAssetUpdateResult> {
    const assetId = request.getId();
    const engineId = request.getString("engineId");
    const metadata = request.getBodyObject("metadata");
    const refresh = request.getRefresh();

    const updatedAsset = await this.assetService.update(
      request.getUser(),
      engineId,
      assetId,
      metadata,
      {
        refresh,
      }
    );

    return AssetSerializer.serialize(updatedAsset);
  }

  async create(request: KuzzleRequest): Promise<ApiAssetCreateResult> {
    const engineId = request.getString("engineId");
    const model = request.getBodyString("model");
    const reference = request.getBodyString("reference");
    const metadata = request.getBodyObject("metadata", {});
    const refresh = request.getRefresh();

    const asset = await this.assetService.create(
      request.getUser(),
      engineId,
      model,
      reference,
      metadata,
      {
        refresh,
      }
    );

    return AssetSerializer.serialize(asset);
  }

  async delete(request: KuzzleRequest): Promise<ApiAssetDeleteResult> {
    const engineId = request.getString("engineId");
    const assetId = request.getId();
    const refresh = request.getRefresh();
    const strict = request.getBoolean("strict");

    await this.assetService.delete(request.getUser(), engineId, assetId, {
      refresh,
      strict,
    });
  }

  async search(request: KuzzleRequest): Promise<ApiAssetSearchResult> {
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
      lang,
      scroll,
      size,
    });

    return result;
  }

  async getMeasures(
    request: KuzzleRequest
  ): Promise<ApiAssetGetMeasuresResult> {
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
      target: "asset",
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
      target: "asset",
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
}
