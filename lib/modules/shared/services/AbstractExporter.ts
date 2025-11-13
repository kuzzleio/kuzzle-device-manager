import { UUID, randomUUID } from "node:crypto";
import { PassThrough, Readable } from "node:stream";
import { stringify } from "csv-stringify/sync";
import {
  JSONObject,
  KDocumentContentGeneric,
  KHit,
  NotFoundError,
  SearchResult,
  User,
} from "kuzzle";
import { EngineContent } from "kuzzle-plugin-commons";
import _ from "lodash";

import { DeviceManagerPlugin, InternalCollection } from "../../plugin";

export interface ExporterOption {
  /**
   * Expiration time of export in seconds before being invalid
   */
  expireTime: number;
}

export interface ExportParams {
  query: JSONObject;
  sort?: JSONObject;
  lang?: "elasticsearch" | "koncorde";
}

export interface Column {
  header: string;
  path: string;
  isMeasure?: boolean;
  isIsoDate?: boolean;
}

export abstract class AbstractExporter<P extends ExportParams = ExportParams> {
  protected config: ExporterOption = {
    expireTime: 2 * 60,
  };

  constructor(
    protected plugin: DeviceManagerPlugin,
    protected target: InternalCollection,
    config: Partial<ExporterOption> = {},
  ) {
    if (Object.keys(config).length > 0) {
      this.config = {
        ...this.config,
        ...config,
      };
    }
  }

  protected get sdk() {
    return this.plugin.context.accessors.sdk;
  }

  protected get ms() {
    return this.sdk.ms;
  }

  protected get log() {
    return this.plugin.context.log;
  }

  protected async getEngine(engineId: string): Promise<EngineContent> {
    const engine = await this.sdk.document.get<{ engine: EngineContent }>(
      this.plugin.config.adminIndex,
      InternalCollection.CONFIG,
      `engine-device-manager--${engineId}`,
    );

    return engine._source.engine;
  }

  protected abstract exportRedisKey(engineId: string, exportId: string): string;

  protected abstract getLink(
    engineId: string,
    exportId: UUID,
    params: P,
  ): string;

  /**
   * Retrieve a prepared export and write each document as a CSV in the stream
   *
   * This method never returns a rejected promise, but write potential error in
   * the stream.
   */
  abstract sendExport(engineId: string, exportId: string): Promise<Readable>;

  async prepareExport(engineId: string, user: User, params: P) {
    const exportId = randomUUID();

    await this.ms.setex(
      this.exportRedisKey(engineId, exportId),
      JSON.stringify(params),
      this.config.expireTime,
    );

    let link = this.getLink(engineId, exportId, params);
    if (user._id !== "-1") {
      const { result } = await this.sdk.as(user).query({
        action: "createToken",
        controller: "auth",
        expiresIn: this.config.expireTime * 1000,
        singleUse: true,
      });

      link += `?jwt=${result.token}`;
    }

    return link;
  }

  protected formatHit(
    columns: Column[],
    hit: KHit<KDocumentContentGeneric>,
  ): string[] {
    return columns.map(({ path, isIsoDate }) => {
      const formattedValue = _.get(hit, path, null);
      if (formattedValue !== null && isIsoDate) {
        return new Date(formattedValue).toISOString();
      }
      return _.get(hit, path, null);
    });
  }

  async getExport(engineId: string, exportId: string): Promise<P> {
    const exportParams = await this.sdk.ms.get(
      this.exportRedisKey(engineId, exportId),
    );

    if (!exportParams) {
      throw new NotFoundError(`Export "${exportId}" not found or expired.`);
    }

    return JSON.parse(exportParams);
  }

  async getExportStream(
    request: SearchResult<KHit<KDocumentContentGeneric>>,
    columns: Column[],
  ) {
    const stream = new PassThrough();

    let result = request;
    try {
      stream.write(stringify([columns.map((column) => column.header)]));
      while (result) {
        for (const hit of result.hits) {
          stream.write(stringify([this.formatHit(columns, hit)]));
        }
        result = await result.next();
      }
    } catch (error) {
      stream.write(error.message);
    } finally {
      stream.end();
    }

    return stream;
  }
}
