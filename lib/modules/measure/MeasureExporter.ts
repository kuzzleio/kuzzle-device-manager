import { UUID } from "node:crypto";
import { InternalError, JSONObject, KHit, User } from "kuzzle";
import _ from "lodash";

import {
  AskModelAssetGet,
  AskModelDeviceGet,
  AskModelMeasureGet,
} from "../model";
import { InternalCollection } from "../plugin";
import {
  AbstractExporter,
  Column,
  DigitalTwinContent,
  ExportParams,
  ask,
  flattenObject,
} from "../shared";

import { NamedMeasures } from "../decoder";
import { MeasureContent } from "./exports";

interface MeasureSearchParams extends ExportParams {
  id: string;
  type?: string;
  startAt?: string;
  endAt?: string;
}

interface MeasuresSearchOptions {
  from?: number;
  size?: number;
}

interface MeasureExportParams extends ExportParams {
  id: string;
  model: string;
}

export class MeasureExporter extends AbstractExporter<MeasureExportParams> {
  protected exportRedisKey(engineId: string, exportId: string) {
    return `exports:measures:${engineId}:${exportId}`;
  }

  protected getLink(
    engineId: string,
    exportId: UUID,
    params: MeasureExportParams
  ) {
    return `/_/device-manager/${engineId}/${this.target}/${params.id}/measures/_export/${exportId}`;
  }

  /**
   * Searches for measures and return them in a standard JSON
   */
  async search(
    engineId: string,
    params: MeasureSearchParams,
    options?: MeasuresSearchOptions
  ) {
    const searchQuery = this.prepareMeasureSearch(params);

    const result = await this.sdk.document.search<MeasureContent>(
      engineId,
      InternalCollection.MEASURES,
      {
        query: searchQuery,
        sort: params.sort ?? { measuredAt: "desc" },
      },
      {
        from: options?.from ?? 0,
        lang: "koncorde",
        size: options?.size ?? 25,
      }
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
    engineId: string,
    user: User,
    params: MeasureSearchParams
  ) {
    const digitalTwin = await this.sdk.document.get<DigitalTwinContent>(
      engineId,
      this.target,
      params.id
    );

    const searchQuery = this.prepareMeasureSearch(params);

    const exportParams: MeasureExportParams = {
      id: params.id,
      lang: params.lang,
      model: digitalTwin._source.model,
      query: searchQuery,
      sort: params.sort ?? { measuredAt: "desc" },
    };

    /**
     * ? Prevent error duplicate result on search with sort.
     * "Unable to retrieve all results from search: the sort combination must identify one item only. Add document "_id" to the sort."
     */
    if (exportParams.sort._id === undefined) {
      exportParams.sort._id = "asc";
    }

    return super.prepareExport(engineId, user, exportParams);
  }

  protected formatHit(columns: Column[], hit: KHit<MeasureContent>) {
    return columns.map(({ header: measureName, isMeasure, path }) => {
      if (
        isMeasure &&
        this.target === InternalCollection.ASSETS &&
        hit._source.asset?.measureName !== measureName
      ) {
        return null;
      }

      return _.get(hit, path, null);
    });
  }

  /**
   * Retrieve a prepared export and write each document as a CSV in the stream
   *
   * This method never returns a rejected promise, but write potential error in
   * the stream.
   */
  async sendExport(engineId: string, exportId: string) {
    const {
      query,
      sort,
      model,
      lang = "elasticsearch",
    } = await this.getExport(engineId, exportId);

    const result = await this.sdk.document.search<MeasureContent>(
      engineId,
      InternalCollection.MEASURES,
      { query, sort },
      { lang, size: 200 }
    );

    const targetModel =
      this.target === InternalCollection.ASSETS ? "asset" : "device";
    const engine = await this.getEngine(engineId);
    const modelDocument = await ask<AskModelDeviceGet | AskModelAssetGet>(
      `ask:device-manager:model:${targetModel}:get`,
      {
        engineGroup: engine.group,
        model,
      }
    );

    const measureColumns = await this.generateMeasureColumns(
      modelDocument[targetModel].measures
    );

    const columns: Column[] = [
      { header: "Payload Id", path: "_id" },
      { header: "Measured At", path: "_source.measuredAt" },
      { header: "Measure Type", path: "_source.type" },
      { header: "Device Id", path: "_source.origin._id" },
      { header: "Device Model", path: "_source.origin.deviceModel" },
      { header: "Asset Id", path: "_source.asset._id" },
      { header: "Asset Model", path: "_source.asset.model" },
      ...measureColumns,
    ];

    const stream = this.getExportStream(result, columns);
    await this.sdk.ms.del(this.exportRedisKey(engineId, exportId));

    return stream;
  }

  private async generateMeasureColumns(
    documentMeasures: NamedMeasures
  ): Promise<Array<Column & { isMeasure: true }>> {
    /**
     * @example
     * {
     *   temperature: ['temperature.type'],
     *   acceleration: [
     *     'acceleration.properties.x.type',
     *     'acceleration.properties.y.type',
     *     'acceleration.properties.z.type',
     *     'accuracy.type'
     *   ]
     * }
     */
    const mappingsByMeasureType: Record<string, string[]> = {};
    const measures: Array<Column & { isMeasure: true }> = [];

    for (const { name, type } of documentMeasures) {
      if (!(type in mappingsByMeasureType)) {
        const { measure } = await ask<AskModelMeasureGet>(
          "ask:device-manager:model:measure:get",
          { type }
        );

        mappingsByMeasureType[type] = Object.keys(
          flattenObject(measure.valuesMappings)
        );
      }

      for (const measure of mappingsByMeasureType[type]) {
        /**
         * The path to be used to retrieve the measure values in a Measure Document
         *
         * @example
         * 'temperature', 'acceleration.x', 'accuracy'
         */
        const path = measure.replace(".type", "").replace(".properties", "");

        /**
         * All of this is here to avoid a long header name like 'accelerationSensor.acceleration.x' (we don't need the 'acceleration' part)
         *
         * @example
         * 'temperatureInt', 'accelerationSensor.x', 'accelerationSensor.accuracy'
         */
        const header = `${name}.${path}`.replace(`${name}.${type}`, name);

        measures.push({
          header,
          isMeasure: true,
          path: `_source.values.${path}`,
        });
      }
    }

    return measures;
  }

  private prepareMeasureSearch(params: MeasureSearchParams) {
    if (!this.target) {
      throw new InternalError('Missing "target" parameter');
    }

    const measuredAtRange = {
      range: {
        measuredAt: {
          gte: 0,
          lte: Number.MAX_SAFE_INTEGER,
        },
      },
    };

    if (params.startAt) {
      measuredAtRange.range.measuredAt.gte = new Date(params.startAt).getTime();
    }

    if (params.endAt) {
      measuredAtRange.range.measuredAt.lte = new Date(params.endAt).getTime();
    }

    const searchQuery: JSONObject = {
      and: [measuredAtRange],
    };

    if (this.target === InternalCollection.ASSETS) {
      searchQuery.and.push({
        equals: { "asset._id": params.id },
      });
    } else {
      searchQuery.and.push({
        equals: { "origin._id": params.id },
      });
    }

    if (params.type) {
      searchQuery.and.push({ equals: { type: params.type } });
    }

    if (params.query) {
      searchQuery.and.push(params.query);
    }

    return searchQuery;
  }
}
