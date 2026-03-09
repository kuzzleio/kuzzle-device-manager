import { NotFoundError } from "kuzzle";
import { onAsk } from "kuzzle-plugin-commons";
import { JSONObject, KHit } from "kuzzle-sdk";

import { MeasureContent } from "../../measure";
import { DeviceManagerPlugin, InternalCollection } from "../../plugin";
import { ApiDigitalTwinMGetLastMeasuredAtResult } from "../types/DigitalTwinApi";
import { AskDigitalTwinLastMeasuresGet } from "../types/DigitalTwinEvents";

import { BaseService } from "./BaseService";

type MGetLastMeasuresAggregation = {
  byDigitalTwin: {
    buckets: Array<{
      key: string;
      doc_count: number;
      byMeasureName: {
        buckets: Array<{
          key: string;
          doc_count: number;
          lastMeasure: {
            hits: {
              hits: KHit<MeasureContent>[];
            };
          };
        }>;
      };
    }>;
  };
};

type MGetLastMeasuredAtAggregation = {
  byDigitalTwin: {
    buckets: Array<{
      key: string;
      doc_count: number;
      lastMeasuredAt: {
        value: number;
        value_as_string: number;
      };
    }>;
  };
};

type DigitalTwinAggregationQueryParameters = {
  measureNameField: string;
  idField: string;
  query: JSONObject;
};

export class DigitalTwinService extends BaseService {
  private readonly digitalTwinType: "asset" | "device";

  constructor(
    plugin: DeviceManagerPlugin,
    private targetCollection: InternalCollection,
  ) {
    super(plugin);

    this.digitalTwinType =
      this.targetCollection === InternalCollection.ASSETS ? "asset" : "device";

    this.registerAskEvents();
  }

  protected registerAskEvents() {
    onAsk<AskDigitalTwinLastMeasuresGet>(
      `ask:device-manager:${this.digitalTwinType}:get-last-measures`,
      (payload) => {
        return this.getLastMeasures(payload.engineId, payload.digitalTwinId);
      },
    );
  }

  /**
   * Gets the last measures of a digital twin
   */
  public async getLastMeasures(
    engineId: string,
    digitalTwinId: string,
    measureCount = 100,
  ): Promise<MeasureContent[]> {
    const measures = await this.mGetLastMeasures(
      engineId,
      [digitalTwinId],
      measureCount,
    );

    if (!(digitalTwinId in measures)) {
      throw new NotFoundError(
        "No measure could be found for this digital twin",
      );
    }

    return measures[digitalTwinId];
  }

  /**
   * Gets the last measures of multiple digital twins
   */
  public async mGetLastMeasures(
    engineId: string,
    digitalTwinIds: string[],
    measureCount = 100,
  ): Promise<Record<string, MeasureContent[]>> {
    if (digitalTwinIds.length === 0) {
      return {};
    }

    const aggregationParameters =
      this.getAggregationQueryParameters(digitalTwinIds);

    const result = await this.sdk.document.search(
      engineId,
      InternalCollection.MEASURES,
      {
        aggregations: {
          byDigitalTwin: {
            aggregations: {
              byMeasureName: {
                aggregations: {
                  lastMeasure: {
                    top_hits: {
                      size: 1,
                      sort: { measuredAt: "desc" },
                    },
                  },
                },
                terms: {
                  field: aggregationParameters.measureNameField,
                  size: measureCount,
                },
              },
            },
            terms: {
              field: aggregationParameters.idField,
              size: digitalTwinIds.length,
            },
          },
        },
        query: aggregationParameters.query,
      },
      {
        size: 0,
      },
    );

    const aggregations = result.aggregations as MGetLastMeasuresAggregation;
    return aggregations.byDigitalTwin.buckets.reduce<
      Record<string, MeasureContent[]>
    >((digitalTwinAccumulator, digitalTwinBucket) => {
      const measureContents = digitalTwinBucket.byMeasureName.buckets.reduce<
        MeasureContent[]
      >((measureAccumulator, measureBucket) => {
        return [
          ...measureAccumulator,
          ...measureBucket.lastMeasure.hits.hits.map((hit) => hit._source),
        ];
      }, []);

      return {
        ...digitalTwinAccumulator,
        [digitalTwinBucket.key]: measureContents,
      };
    }, {});
  }

  public async getLastMeasuredAt(
    engineId: string,
    digitalTwinId: string,
  ): Promise<number> {
    const aggregationParameters = this.getAggregationQueryParameters([
      digitalTwinId,
    ]);

    const result = await this.sdk.document.search<
      Pick<MeasureContent, "measuredAt">
    >(
      engineId,
      InternalCollection.MEASURES,
      {
        _source: "measuredAt",
        query: aggregationParameters.query,
        sort: {
          measuredAt: "desc",
        },
      },
      {
        size: 1,
      },
    );

    if (result.hits.length < 1) {
      throw new NotFoundError(
        "No measure could be found for this digital twin",
      );
    }

    return result.hits[0]._source.measuredAt;
  }

  public async mGetLastMeasuredAt(
    engineId: string,
    digitalTwinIds: string[],
  ): Promise<ApiDigitalTwinMGetLastMeasuredAtResult> {
    if (digitalTwinIds.length === 0) {
      return {};
    }

    const aggregationParameters =
      this.getAggregationQueryParameters(digitalTwinIds);

    const result = await this.sdk.document.search(
      engineId,
      InternalCollection.MEASURES,
      {
        aggregations: {
          byDigitalTwin: {
            aggregations: {
              lastMeasuredAt: {
                max: {
                  field: "measuredAt",
                },
              },
            },
            terms: {
              field: aggregationParameters.idField,
              size: digitalTwinIds.length,
            },
          },
        },
        query: aggregationParameters.query,
      },
      {
        size: 0,
      },
    );

    const aggregations = result.aggregations as MGetLastMeasuredAtAggregation;
    return aggregations.byDigitalTwin.buckets.reduce<ApiDigitalTwinMGetLastMeasuredAtResult>(
      (accumulator, bucket) => {
        return {
          ...accumulator,
          [bucket.key]: bucket.lastMeasuredAt.value,
        };
      },
      {},
    );
  }

  private getAggregationQueryParameters(
    digitalTwinId: string[],
  ): DigitalTwinAggregationQueryParameters {
    switch (this.digitalTwinType) {
      case "asset":
        return {
          idField: "asset._id",
          measureNameField: "asset.measureName",
          query: {
            terms: {
              "asset._id": digitalTwinId,
            },
          },
        };

      case "device":
        return {
          idField: "origin._id",
          measureNameField: "origin.measureName",
          query: {
            bool: {
              must: [
                { terms: { "origin._id": digitalTwinId } },
                { term: { "origin.type": "device" } },
              ],
            },
          },
        };
    }
  }
  public async getEngine(engineId: string): Promise<JSONObject> {
    const engine = await this.sdk.document.get(
      this.config.adminIndex,
      InternalCollection.CONFIG,
      `engine-device-manager--${engineId}`,
    );

    return engine._source.engine;
  }
}
