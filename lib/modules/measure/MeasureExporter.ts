import { randomUUID } from "node:crypto";
import { PassThrough } from "node:stream";

import _ from "lodash";
import { InternalError, JSONObject, KDocument, NotFoundError } from "kuzzle";
import { stringify } from "csv-stringify/sync";

import { AskModelAssetGet, AskModelDeviceGet } from "../model";
import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import { ask, DigitalTwinContent } from "../shared";

import { MeasureContent } from "./exports";

type ExportOptions = {
  sort?: JSONObject;
  query?: JSONObject;
  from?: number;
  size?: number;
  startAt?: string;
  endAt?: string;
  type?: string;
};

const FIVE_MINUTES = 5 * 60;

type ExportParams = {
  query: JSONObject;
  target: "asset" | "device";
  model: string;
  from: number;
  sort: JSONObject;
  id: string;
};

export class MeasureExporter {
  private target?: "asset" | "device";

  private get sdk() {
    return this.plugin.context.accessors.sdk;
  }

  constructor(
    private plugin: DeviceManagerPlugin,
    private engineId: string,
    { target }: { target?: "asset" | "device" } = {}
  ) {
    this.target = target;
  }

  /**
   * Searches for measures and return them in a standard JSON
   */
  async search(
    digitalTwinId: string,
    {
      size = 25,
      from = 0,
      endAt,
      startAt,
      query,
      sort = { measuredAt: "desc" },
      type,
    }: ExportOptions
  ) {
    const { searchQuery } = await this.prepareMeasureSearch(
      digitalTwinId,
      startAt,
      endAt,
      query,
      type
    );

    const result = await this.sdk.document.search<MeasureContent>(
      this.engineId,
      InternalCollection.MEASURES,
      { query: searchQuery, sort },
      { from, lang: "koncorde", size: size }
    );

    return { measures: result.hits, total: result.total };
  }

  /**
   * Prepare a measure export by saving the parameters in Redis.
   *
   * We need this method to process the export in 2 steps:
   *   - preparing the export with a POST or WebSocket request
   *   - download the export (only with a browser <a> link)
   *
   * Never return a rejected promise and write potential error on the stream
   */
  async prepareExport(
    digitalTwinId: string,
    {
      from = 0,
      endAt,
      startAt,
      query,
      sort = { measuredAt: "desc" },
      type,
    }: ExportOptions
  ): Promise<{ exportId: string }> {
    const { digitalTwin, searchQuery } = await this.prepareMeasureSearch(
      digitalTwinId,
      startAt,
      endAt,
      query,
      type
    );

    const exportParams: ExportParams = {
      target: this.target,
      model: digitalTwin._source.model,
      from,
      query: searchQuery,
      sort,
      id: digitalTwinId,
    };

    const exportId = randomUUID();

    await this.sdk.ms.setex(
      this.exportRedisKey(exportId),
      JSON.stringify(exportParams),
      FIVE_MINUTES
    );

    return { exportId };
  }

  /**
   * Retrieve a prepared export and write each document as a CSV in the stream
   *
   * This method never returns a rejected promise, but write potential error in
   * the stream.
   */
  async sendExport(stream: PassThrough, exportId: string) {
    try {
      const { query, from, sort, model, target } = await this.getExport(
        exportId
      );

      let result = await this.sdk.document.search<MeasureContent>(
        this.engineId,
        InternalCollection.MEASURES,
        { query, sort },
        { from, lang: "koncorde", size: 200 }
      );

      const engine = await this.getEngine();
      const modelDocument = await ask<AskModelDeviceGet | AskModelAssetGet>(
        `ask:device-manager:model:${target}:get`,
        {
          model,
          engineGroup: engine.group,
        }
      );

      const columns = [
        "measuredAt",
        "type",
        "origin._id",
        "origin.deviceModel",
        "asset._id",
        "asset.model",
        ...modelDocument[target].measures.map((m) => `values.${m.name}`),
      ];

      stream.write(stringify([["_id", ...columns]]));

      while (result) {
        for (const hit of result.hits) {
          stream.write(
            stringify([
              [
                hit._id,
                ...columns.map((column) => _.get(hit._source, column, null)),
              ],
            ])
          );
        }

        result = await result.next();
      }

      await this.sdk.ms.del(this.exportRedisKey(exportId));
    } catch (error) {
      stream.write(error.message);
    } finally {
      stream.end();
    }
  }

  async getExport(exportId: string) {
    const exportParams = await this.sdk.ms.get(this.exportRedisKey(exportId));

    if (!exportParams) {
      throw new NotFoundError(`Export "${exportId}" not found or expired.`);
    }

    return JSON.parse(exportParams) as ExportParams;
  }

  private exportRedisKey(exportId: string) {
    return `exports:measures:${this.engineId}:${exportId}`;
  }

  private async prepareMeasureSearch(
    digitalTwinId: string,
    startAt?: string,
    endAt?: string,
    query?: JSONObject,
    type?: string
  ) {
    if (!this.target) {
      throw new InternalError('Missing "target" parameter');
    }

    const digitalTwin: KDocument<DigitalTwinContent> =
      await this.sdk.document.get(
        this.engineId,
        this.target === "asset"
          ? InternalCollection.ASSETS
          : InternalCollection.DEVICES,
        digitalTwinId
      );

    const measuredAtRange = {
      range: {
        measuredAt: {
          gte: 0,
          lte: Number.MAX_SAFE_INTEGER,
        },
      },
    };

    if (startAt) {
      measuredAtRange.range.measuredAt.gte = new Date(startAt).getTime();
    }

    if (endAt) {
      measuredAtRange.range.measuredAt.lte = new Date(endAt).getTime();
    }

    const searchQuery: JSONObject = {
      and: [measuredAtRange],
    };

    if (this.target === "asset") {
      searchQuery.and.push({
        equals: { "asset._id": digitalTwinId },
      });
    } else {
      searchQuery.and.push({
        equals: { "origin._id": digitalTwinId },
      });
    }

    if (type) {
      searchQuery.and.push({ equals: { type } });
    }

    if (query) {
      searchQuery.and.push(query);
    }

    return { digitalTwin, searchQuery };
  }

  private async getEngine(): Promise<JSONObject> {
    const engine = await this.sdk.document.get(
      this.plugin.config.adminIndex,
      InternalCollection.CONFIG,
      `engine-device-manager--${this.engineId}`
    );

    return engine._source.engine;
  }
}
