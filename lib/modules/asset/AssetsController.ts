import {
  ControllerDefinition,
  HttpStream,
  KuzzleError,
  KuzzleRequest,
} from "kuzzle";

import { MeasureExporter } from "../measure/";
import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import { DigitalTwinExporter, EmbeddedMeasure } from "../shared";

import { AssetService } from "./AssetService";
import { AssetSerializer } from "./model/AssetSerializer";
import {
  ApiAssetCreateResult,
  ApiAssetUpsertResult,
  ApiAssetDeleteResult,
  ApiAssetGetMeasuresResult,
  ApiAssetGetResult,
  ApiAssetSearchResult,
  ApiAssetUpdateResult,
  ApiAssetMigrateTenantResult,
  ApiAssetMetadataReplaceResult,
  ApiAssetGetLastMeasuresResult,
  ApiAssetMGetLastMeasuredAtResult,
  ApiAssetMGetLastMeasuresResult,
  ApiAssetGetLastMeasuredAtResult,
} from "./types/AssetApi";

export class AssetsController {
  public definition: ControllerDefinition;
  private exporter: DigitalTwinExporter;
  private measureExporter: MeasureExporter;

  constructor(
    private plugin: DeviceManagerPlugin,
    private assetService: AssetService,
  ) {
    /* eslint-disable sort-keys */
    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ path: "device-manager/:engineId/assets", verb: "post" }],
        },
        upsert: {
          handler: this.upsert.bind(this),
          http: [
            { path: "device-manager/:engineId/assets/:_id", verb: "post" },
          ],
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
        replaceMetadata: {
          handler: this.replaceMetadata.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assets/:_id/metadata",
              verb: "patch",
            },
          ],
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
        getLastMeasures: {
          handler: this.getLastMeasures.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assets/:_id/lastMeasures",
              verb: "get",
            },
            {
              path: "device-manager/:engineId/assets/:_id/lastMeasures",
              verb: "post",
            },
          ],
        },
        mGetLastMeasures: {
          handler: this.mGetLastMeasures.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assets/_mGetLastMeasures",
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
        export: {
          handler: this.export.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assets/_export/:exportId",
              verb: "get",
            },
            {
              path: "device-manager/:engineId/assets/_export",
              verb: "post",
            },
          ],
        },
        migrateTenant: {
          handler: this.migrateTenant.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assets/_migrateTenant",
              verb: "post",
            },
          ],
        },
        getLastMeasuredAt: {
          handler: this.getLastMeasuredAt.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assets/:_id/lastMeasuredAt",
              verb: "get",
            },
            {
              path: "device-manager/:engineId/assets/:_id/lastMeasuredAt",
              verb: "post",
            },
          ],
        },
        mGetLastMeasuredAt: {
          handler: this.mGetLastMeasuredAt.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assets/_mGetLastMeasuredAt",
              verb: "post",
            },
          ],
        },
      },
    };
    /* eslint-enable sort-keys */

    this.exporter = new DigitalTwinExporter(
      this.plugin,
      InternalCollection.ASSETS,
    );
    this.measureExporter = new MeasureExporter(
      this.plugin,
      InternalCollection.ASSETS,
    );
  }

  async get(request: KuzzleRequest): Promise<ApiAssetGetResult> {
    const assetId = request.getId();
    const engineId = request.getString("engineId");

    const asset = await this.assetService.get(engineId, assetId, request);

    return AssetSerializer.serialize(asset);
  }

  async upsert(request: KuzzleRequest): Promise<ApiAssetUpsertResult> {
    const engineId = request.getString("engineId");
    const model = request.getBodyString("model");
    const reference = request.getBodyString("reference");
    const metadata = request.getBodyObject("metadata");

    const upsertAsset = await this.assetService.upsert(
      engineId,
      model,
      reference,
      metadata,
      request,
    );

    return AssetSerializer.serialize(upsertAsset);
  }

  async update(request: KuzzleRequest): Promise<ApiAssetUpdateResult> {
    const assetId = request.getId();
    const engineId = request.getString("engineId");
    const metadata = request.getBodyObject("metadata");

    const updatedAsset = await this.assetService.update(
      engineId,
      assetId,
      metadata,
      request,
    );

    return AssetSerializer.serialize(updatedAsset);
  }

  async replaceMetadata(
    request: KuzzleRequest,
  ): Promise<ApiAssetMetadataReplaceResult> {
    const assetId = request.getId();
    const engineId = request.getString("engineId");
    const metadata = request.getBodyObject("metadata");

    const updatedAsset = await this.assetService.replaceMetadata(
      engineId,
      assetId,
      metadata,
      request,
    );

    return AssetSerializer.serialize(updatedAsset);
  }

  async create(request: KuzzleRequest): Promise<ApiAssetCreateResult> {
    const engineId = request.getString("engineId");
    const model = request.getBodyString("model");
    const reference = request.getBodyString("reference");
    const metadata = request.getBodyObject("metadata", {});

    const asset = await this.assetService.create(
      engineId,
      model,
      reference,
      metadata,
      request,
    );

    return AssetSerializer.serialize(asset);
  }

  async delete(request: KuzzleRequest): Promise<ApiAssetDeleteResult> {
    const engineId = request.getString("engineId");
    const assetId = request.getId();

    await this.assetService.delete(engineId, assetId, request);
  }

  async search(request: KuzzleRequest): Promise<ApiAssetSearchResult> {
    return this.assetService.search(
      request.getString("engineId"),
      request.getSearchParams(),
      request,
    );
  }

  async getMeasures(
    request: KuzzleRequest,
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
    const lang = request.getLangParam();

    const { measures, total } = await this.measureExporter.search(
      engineId,
      {
        endAt,
        id,
        lang,
        query,
        sort,
        startAt,
        type,
      },
      {
        from,
        size,
      },
    );

    return { measures, total };
  }

  async getLastMeasures(
    request: KuzzleRequest,
  ): Promise<ApiAssetGetLastMeasuresResult> {
    const assetId = request.getId();
    const engineId = request.getString("engineId");
    const measureCount = request.getNumber("measureCount", 100);

    const results = await this.assetService.getLastMeasures(
      engineId,
      assetId,
      measureCount,
    );

    return results.reduce<ApiAssetGetLastMeasuresResult>(
      (accumulator, result) => {
        const measure: EmbeddedMeasure = {
          measuredAt: result.measuredAt,
          name: result.asset.measureName,
          originId: result.origin._id,
          payloadUuids: result.origin.payloadUuids,
          type: result.type,
          values: result.values,
        };

        return {
          ...accumulator,
          [result.asset.measureName]: measure,
        };
      },
      {},
    );
  }

  async mGetLastMeasures(
    request: KuzzleRequest,
  ): Promise<ApiAssetMGetLastMeasuresResult> {
    const engineId = request.getString("engineId");
    const measureCount = request.getNumber("measureCount", 100);
    const assetIds = request.getBodyArray("ids");

    const results = await this.assetService.mGetLastMeasures(
      engineId,
      assetIds,
      measureCount,
    );

    const response: ApiAssetMGetLastMeasuresResult = {};

    for (const [assetId, measures] of Object.entries(results)) {
      response[assetId] = measures.reduce<ApiAssetGetLastMeasuresResult>(
        (accumulator, result) => {
          const measure: EmbeddedMeasure = {
            measuredAt: result.measuredAt,
            name: result.asset.measureName,
            originId: result.origin._id,
            payloadUuids: result.origin.payloadUuids,
            type: result.type,
            values: result.values,
          };

          return {
            ...accumulator,
            [result.asset.measureName]: measure,
          };
        },
        {},
      );
    }

    return response;
  }

  async exportMeasures(request: KuzzleRequest) {
    const engineId = request.getString("engineId");

    if (
      request.context.connection.protocol === "http" &&
      request.context.connection.misc.verb === "GET"
    ) {
      try {
        const exportId = request.getString("exportId");

        const { id } = await this.measureExporter.getExport(engineId, exportId);
        const stream = await this.measureExporter.sendExport(
          engineId,
          exportId,
        );

        request.response.configure({
          headers: {
            "Content-Disposition": `attachment; filename="asset-${id}.csv"`,
            "Content-Type": "text/csv",
          },
        });

        return new HttpStream(stream);
      } catch (error) {
        // ? Like this endpoint is mostly called by browser prefer return raw message for essyier readable error
        request.response.configure({
          format: "raw",
          headers: {
            "Content-Type": "text/plain",
          },
          status: (error as KuzzleError).status,
        });

        return error.message;
      }
    }

    const id = request.getId();
    const startAt = request.input.args.startAt
      ? request.getDate("startAt")
      : null;
    const endAt = request.input.args.endAt ? request.getDate("endAt") : null;
    const query = request.input.body?.query;
    const sort = request.input.body?.sort;
    const type = request.input.args.type;
    const lang = request.getLangParam();

    const link = await this.measureExporter.prepareExport(
      engineId,
      request.getUser(),
      {
        endAt,
        id,
        lang,
        query,
        sort,
        startAt,
        type,
      },
    );

    return { link };
  }

  async export(request: KuzzleRequest) {
    const engineId = request.getString("engineId");

    if (
      request.context.connection.protocol === "http" &&
      request.context.connection.misc.verb === "GET"
    ) {
      try {
        const exportId = request.getString("exportId");
        const stream = await this.exporter.sendExport(engineId, exportId);

        request.response.configure({
          headers: {
            "Content-Disposition": `attachment; filename="${InternalCollection.ASSETS}.csv"`,
            "Content-Type": "text/csv",
          },
        });

        return new HttpStream(stream);
      } catch (error) {
        // ? Like this endpoint is mostly called by browser prefer return raw message for essyier readable error
        request.response.configure({
          format: "raw",
          headers: {
            "Content-Type": "text/plain",
          },
          status: (error as KuzzleError).status,
        });

        return error.message;
      }
    }

    const query = request.input.body?.query;
    const sort = request.input.body?.sort;
    const lang = request.getLangParam();

    const link = await this.exporter.prepareExport(
      engineId,
      request.getUser(),
      {
        lang,
        query,
        sort,
      },
    );

    return { link };
  }

  async migrateTenant(
    request: KuzzleRequest,
  ): Promise<ApiAssetMigrateTenantResult> {
    const assetsList = request.getBodyArray("assetsList");
    const engineId = request.getString("engineId");
    const newEngineId = request.getBodyString("newEngineId");

    const { errors, successes } = await this.assetService.migrateTenant(
      request.getUser(),
      assetsList,
      engineId,
      newEngineId,
    );

    return { errors, successes };
  }

  async getLastMeasuredAt(
    request: KuzzleRequest,
  ): Promise<ApiAssetGetLastMeasuredAtResult> {
    const assetId = request.getId();
    const engineId = request.getString("engineId");

    const lastMeasuredAt = await this.assetService.getLastMeasuredAt(
      engineId,
      assetId,
    );

    return {
      lastMeasuredAt,
    };
  }

  async mGetLastMeasuredAt(
    request: KuzzleRequest,
  ): Promise<ApiAssetMGetLastMeasuredAtResult> {
    const engineId = request.getString("engineId");
    const assetIds = request.getBodyArray("ids");

    return this.assetService.mGetLastMeasuredAt(engineId, assetIds);
  }
}
