import {
  KuzzleRequest,
  JSONObject,
  PluginContext,
  EmbeddedSDK,
} from 'kuzzle';

import { Decoder } from '../decoders/Decoder';
import { Sensor } from '../models/Sensor';

export class PayloadService {
  private config: JSONObject;
  private context: PluginContext;

  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor (config: JSONObject, context: PluginContext) {
    this.config = config;
    this.context = context;
  }

  async process (request: KuzzleRequest, decoder: Decoder, { refresh=undefined } = {}) {
    const payload = request.input.body;

    // Will throw if the payload is invalid
    await decoder.validate(payload, request);

    const sensorContent = await decoder.decode(payload, request);

    const sensor = new Sensor(sensorContent);

    const exists = await this.sdk.document.exists(
      this.config.adminIndex,
      'sensors',
      sensor._id);

    if (exists) {
      return this.update(sensor, decoder, request, { refresh });
    }

    return this.register(sensor, decoder, request, { refresh });
  }

  private async register (
    sensor: Sensor,
    decoder: Decoder,
    request: KuzzleRequest,
    { refresh }
  ) {
    const enrichedSensor = await decoder.beforeRegister(sensor, request);

    await this.sdk.document.create(
      this.config.adminIndex,
      'sensors',
      enrichedSensor._source,
      enrichedSensor._id,
      { refresh });

    return decoder.afterRegister(enrichedSensor, request);
  }

  private async update (
    sensor: Sensor,
    decoder: Decoder,
    request: KuzzleRequest,
    { refresh }
  ) {
    const refreshableCollections = [];

    const previousSensor = await this.sdk.document.get(
      this.config.adminIndex,
      'sensors',
      sensor._id);

    const enrichedSensor = await decoder.beforeUpdate(sensor, request);

    await this.sdk.document.update(
      this.config.adminIndex,
      'sensors',
      enrichedSensor._id,
      enrichedSensor._source);

    refreshableCollections.push([this.config.adminIndex, 'sensors']);

    const tenantId = previousSensor._source.tenantId;
    // Propagate sensor into tenant index
    if (tenantId) {
      await this.sdk.document.update(
        tenantId,
        'sensors',
        enrichedSensor._id,
        enrichedSensor._source);

      // Historize
      await this.sdk.document.create(
        tenantId,
        'sensors-history',
        {
          ...previousSensor._source,
          ...enrichedSensor._source
        });

      refreshableCollections.push([tenantId, 'sensors']);
      refreshableCollections.push([tenantId, 'sensors-history']);
    }

    // Propagate measures into linked asset
    const assetId = previousSensor._source.assetId;
    if (assetId) {
      const assetMeasures = await decoder.copyToAsset(enrichedSensor);

      await this.sdk.document.update(
        tenantId,
        'assets',
        assetId,
        { measures: assetMeasures });

      refreshableCollections.push([tenantId, 'assets']);
    }

    if (refresh === 'wait_for') {
      await Promise.all(refreshableCollections.map(([index, collection]) => (
        this.sdk.collection.refresh(index, collection)
      )));
    }

    return decoder.afterUpdate(enrichedSensor, request);
  }
}
