import { BadRequestError, KuzzleRequest } from "kuzzle";
import { ask, onAsk } from "kuzzle-plugin-commons";
import { KDocument } from "kuzzle-sdk";
import { KuzzleLogger } from "kuzzle-logger";

import { DecodersRegister } from "../decoder";
import { AskModelMeasureGet } from "../model";
import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import { BaseService, SearchParams } from "../shared";

import {
  AskMeasureAdapterGet,
  MeasureAdapterContent,
  MeasureAdapterMapping,
} from "./exports";

export class MeasureAdapterService extends BaseService {
  readonly logger: KuzzleLogger;

  constructor(
    plugin: DeviceManagerPlugin,
    private decodersRegister: DecodersRegister,
    logger: KuzzleLogger,
  ) {
    super(plugin);
    this.logger = logger;

    onAsk<AskMeasureAdapterGet>(
      "ask:device-manager:measureAdapter:get",
      async ({ engineId, measureAdapterId }) => {
        const measureAdapter =
          await this.sdk.document.get<MeasureAdapterContent>(
            engineId,
            InternalCollection.MEASURE_ADAPTERS,
            measureAdapterId,
          );

        return measureAdapter._source;
      },
    );
  }

  async create(
    _id: string,
    engineId: string,
    name: string,
    source: string,
    mapping: MeasureAdapterMapping[],
    request: KuzzleRequest,
  ): Promise<KDocument<MeasureAdapterContent>> {
    await this.validateMapping(engineId, source, mapping);

    return this.createDocument<MeasureAdapterContent>(
      request,
      { _id, _source: { mapping, name, source } },
      { collection: InternalCollection.MEASURE_ADAPTERS, engineId },
    );
  }

  async get(
    engineId: string,
    _id: string,
    request: KuzzleRequest,
  ): Promise<KDocument<MeasureAdapterContent>> {
    return this.getDocument<MeasureAdapterContent>(request, _id, {
      collection: InternalCollection.MEASURE_ADAPTERS,
      engineId,
    });
  }

  async update(
    _id: string,
    engineId: string,
    name: string | undefined,
    source: string | undefined,
    mapping: MeasureAdapterMapping[] | undefined,
    request: KuzzleRequest,
  ): Promise<KDocument<MeasureAdapterContent>> {
    const existing = await this.get(engineId, _id, request);

    const updatedSource = source ?? existing._source.source;
    const updatedMapping = mapping ?? existing._source.mapping;
    const updatedName = name ?? existing._source.name;

    await this.validateMapping(engineId, updatedSource, updatedMapping);

    return this.updateDocument<MeasureAdapterContent>(
      request,
      {
        _id,
        _source: {
          mapping: updatedMapping,
          name: updatedName,
          source: updatedSource,
        },
      },
      { collection: InternalCollection.MEASURE_ADAPTERS, engineId },
      { source: true },
    );
  }

  async delete(_id: string, engineId: string, request: KuzzleRequest) {
    const assignedDevices = await this.sdk.document.count(
      engineId,
      InternalCollection.DEVICES,
      { query: { term: { measureAdapterId: _id } } },
    );

    if (assignedDevices > 0) {
      throw new BadRequestError(
        `Measure adapter "${_id}" is still assigned to ${assignedDevices} device(s). Unassign it first.`,
      );
    }

    await this.deleteDocument(request, _id, {
      collection: InternalCollection.MEASURE_ADAPTERS,
      engineId,
    });
  }

  async search(
    engineId: string,
    searchParams: SearchParams,
    request: KuzzleRequest,
  ) {
    return this.searchDocument<MeasureAdapterContent>(request, searchParams, {
      collection: InternalCollection.MEASURE_ADAPTERS,
      engineId,
    });
  }

  /**
   * Validate that a mapping is applicable:
   * - `source` must be a registered decoder's device model
   * - every `sourceMeasureName` must be declared by that decoder
   * - every `targetType` must be a registered measure type with exactly one
   *   value field (v1 only supports 1:1 field renaming)
   * - `targetMeasureName` must be unique within the mapping
   */
  private async validateMapping(
    engineId: string,
    source: string,
    mapping: MeasureAdapterMapping[],
  ): Promise<void> {
    if (!mapping || mapping.length === 0) {
      throw new BadRequestError(
        `A measure adapter must declare at least one mapping entry.`,
      );
    }

    let decoder;
    try {
      decoder = this.decodersRegister.get(source);
    } catch {
      throw new BadRequestError(
        `No decoder is registered for device model "${source}".`,
      );
    }

    const declaredMeasureNames = decoder.measures.map((m) => m.name);
    const seenTargetNames = new Set<string>();

    for (const entry of mapping) {
      if (!declaredMeasureNames.includes(entry.sourceMeasureName)) {
        throw new BadRequestError(
          `Measure "${entry.sourceMeasureName}" is not declared by the decoder of device model "${source}".`,
        );
      }

      if (seenTargetNames.has(entry.targetMeasureName)) {
        throw new BadRequestError(
          `Target measure name "${entry.targetMeasureName}" is used more than once in this adapter.`,
        );
      }
      seenTargetNames.add(entry.targetMeasureName);

      let measureModel;
      try {
        measureModel = await ask<AskModelMeasureGet>(
          "ask:device-manager:model:measure:get",
          { engineId, type: entry.targetType },
        );
      } catch {
        throw new BadRequestError(
          `Unknown measure type "${entry.targetType}".`,
        );
      }

      const valueKeys = Object.keys(measureModel.measure.valuesMappings);
      if (valueKeys.length !== 1) {
        throw new BadRequestError(
          `Measure type "${entry.targetType}" has ${valueKeys.length} value fields; measure adapters only support single-value measure types in this version.`,
        );
      }
    }
  }
}
