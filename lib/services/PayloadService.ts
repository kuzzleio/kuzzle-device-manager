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

  async process (request: KuzzleRequest, decoder: Decoder) {
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
      return this.update(sensor, decoder, request);
    }

    return this.register(sensor, decoder, request);
  }

  private async register (sensor: Sensor, decoder: Decoder, request: KuzzleRequest) {
    const enrichedSensor = await decoder.beforeRegister(sensor, request);

    await this.sdk.document.create(
      this.config.adminIndex,
      'sensors',
      enrichedSensor._source,
      enrichedSensor._id);

    return decoder.afterRegister(enrichedSensor, request);
  }

  private async update (sensor: Sensor, decoder: Decoder, request: KuzzleRequest) {
    const enrichedSensor = await decoder.beforeUpdate(sensor, request);

    await this.sdk.document.update(
      this.config.adminIndex,
      'sensors',
      enrichedSensor._id,
      enrichedSensor._source);

    // Propagate sensor into tenant index
    if (enrichedSensor._source.tenantId) {
      await this.sdk.document.update(
        enrichedSensor._source.tenantId,
        'sensors',
        enrichedSensor._id,
        enrichedSensor._source);

      // Historize
      await this.sdk.document.create(
        enrichedSensor._source.tenantId,
        'sensors-history',
        enrichedSensor._source);
    }

    // Propagate measures into linked asset
    if (enrichedSensor._source.assetId) {
      const assetMeasures = await decoder.copyToAsset(enrichedSensor);

      await this.sdk.document.update(
        enrichedSensor._source.tenantId,
        'assets',
        enrichedSensor._source.assetId,
        { measures: assetMeasures });
    }

    return decoder.afterUpdate(enrichedSensor, request);
  }
}
