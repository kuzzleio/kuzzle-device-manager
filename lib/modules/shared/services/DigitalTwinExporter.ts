import { JSONObject, KHit, SearchResult } from "kuzzle";
import { ask } from "kuzzle-plugin-commons";
import { UUID } from "node:crypto";

import {
  AskDigitalTwinLastMeasuresGet,
  DigitalTwinContent,
  DigitalTwinMeasures,
  EmbeddedMeasure,
  flattenObject,
} from "../";
import { NamedMeasures } from "../../decoder";
import { MeasureContent, MeasureOriginDevice } from "../../measure";
import {
  AskModelMeasureGet,
  AssetModelContent,
  DeviceModelContent,
} from "../../model";
import { DeviceManagerPlugin, InternalCollection } from "../../plugin";
import { AbstractExporter, Column, ExporterOption } from "./AbstractExporter";

interface MeasureColumn extends Column {
  isMeasure: boolean;
}

interface DigitalTwinExtraData {
  measures: DigitalTwinMeasures;
  lastMeasuredAt: number;
}

export class DigitalTwinExporter extends AbstractExporter {
  constructor(
    protected plugin: DeviceManagerPlugin,
    protected target: InternalCollection,
    config: Partial<ExporterOption> = {},
  ) {
    super(plugin, target, config);

    this.exportStreamAugmenters.push(this.addMeasuresToExportStream.bind(this));
  }

  protected exportRedisKey(engineId: string, exportId: string) {
    return `exports:${engineId}:${this.target}:${exportId}`;
  }

  protected getLink(engineId: string, exportId: UUID) {
    return `/_/device-manager/${engineId}/${this.target}/_export/${exportId}`;
  }

  async sendExport(engineId: string, exportId: string) {
    const {
      query,
      sort,
      lang = "elasticsearch",
    } = await this.getExport(engineId, exportId);

    const digitalTwins = await this.sdk.document.search<DigitalTwinContent>(
      engineId,
      this.target,
      { query, sort },
      { lang, size: 200 },
    );

    const namedMeasures = await this.getNamedMeasures(engineId);
    const measureColumns = await this.generateMeasureColumns(namedMeasures);

    const columns: Column[] = [
      { header: "Model", path: "_source.model" },
      { header: "Reference", path: "_source.reference" },
      ...measureColumns,
      { header: "lastMeasuredAt", path: "_source.lastMeasuredAt" },
      {
        header: "lastMeasuredAtISO",
        isIsoDate: true,
        path: "_source.lastMeasuredAt",
      },
    ];

    const stream = this.getExportStream(digitalTwins, columns, engineId);

    await this.sdk.ms.del(this.exportRedisKey(engineId, exportId));

    return stream;
  }

  /**
   * Get the deduplicated Named Measures get from models
   */
  private async getNamedMeasures(engineId: string): Promise<NamedMeasures> {
    const type = this.target === InternalCollection.ASSETS ? "asset" : "device";
    const query: JSONObject = {
      and: [{ equals: { type } }],
    };

    if (this.target === InternalCollection.ASSETS) {
      const engine = await this.getEngine(engineId);
      query.and.push({ equals: { engineGroup: engine.group } });
    }

    let result = await this.sdk.document.search<
      AssetModelContent | DeviceModelContent
    >(
      this.plugin.config.adminIndex,
      InternalCollection.MODELS,
      {
        query: { equals: { type } },
      },
      { lang: "koncorde", size: 20 },
    );

    // ? Use a map to dedup the NamedMeasures get from models
    const namedMeasures = new Map<string, NamedMeasures[0]>();
    while (result) {
      for (const { _source } of result.hits) {
        for (const namedMeasure of _source[type].measures as NamedMeasures) {
          if (!namedMeasures.has(namedMeasure.name)) {
            namedMeasures.set(namedMeasure.name, namedMeasure);
          }
        }
      }
      result = await result.next();
    }

    // ? Ensure stable measures order
    return [...namedMeasures.values()].sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
  }

  private async generateMeasureColumns(
    namedMeasures: NamedMeasures,
  ): Promise<MeasureColumn[]> {
    const columns: MeasureColumn[] = [];

    const measuresPath = new Map<string, string[]>();
    for (const { name, type } of namedMeasures) {
      if (!measuresPath.has(name)) {
        const { measure: measureDefinition } = await ask<AskModelMeasureGet>(
          "ask:device-manager:model:measure:get",
          { type },
        );

        const flattenMeasuresPath = Object.keys(
          flattenObject(measureDefinition.valuesMappings),
        ).map((path) => path.replace(".type", "").replace(".properties", ""));

        measuresPath.set(name, flattenMeasuresPath);
      }

      for (const path of measuresPath.get(name)) {
        const header = `${name}.${path}`.replace(`${name}.${type}`, name);

        columns.push({
          header,
          isMeasure: true,
          path: `_source.measures.${name}.values.${path}`,
        });
      }
    }

    return columns;
  }

  private async addMeasuresToExportStream(
    result: SearchResult<KHit<DigitalTwinContent & DigitalTwinExtraData>>,
    _: Column[],
    engineId: string,
  ) {
    const type = this.target === InternalCollection.ASSETS ? "asset" : "device";

    for (const hit of result.hits) {
      let lastMeasures: MeasureContent[];

      try {
        lastMeasures = await ask<AskDigitalTwinLastMeasuresGet>(
          `ask:device-manager:${type}:get-last-measures`,
          {
            digitalTwinId: hit._id,
            engineId,
          },
        );
      } catch (e) {
        continue;
      }

      hit._source.measures = lastMeasures.reduce((accumulator, measure) => {
        const measureName =
          type === "asset"
            ? measure.asset.measureName
            : (measure.origin as MeasureOriginDevice).measureName;

        const embeddedMeasure: EmbeddedMeasure = {
          measuredAt: measure.measuredAt,
          name: measureName,
          originId: measure.origin._id,
          payloadUuids: measure.origin.payloadUuids,
          type: measure.type,
          values: measure.values,
        };

        return {
          ...accumulator,
          [measureName]: embeddedMeasure,
        };
      }, {});

      const lastMeasuredAt = Math.max(
        ...lastMeasures.map((measure) => measure.measuredAt),
      );

      if (Number.isFinite(lastMeasuredAt)) {
        hit._source.lastMeasuredAt = lastMeasuredAt;
      }
    }
  }
}
