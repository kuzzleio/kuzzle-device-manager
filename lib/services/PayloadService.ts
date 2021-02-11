import {
  KuzzleRequest,
  JSONObject,
  PluginContext,
  EmbeddedSDK,
  BadRequestError,
} from 'kuzzle';
import { v4 as uuidv4 } from 'uuid';

import { Decoder } from '../decoders';
import { Sensor } from '../models';

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

    if ( ! payload
      || (typeof payload === 'object' && Object.keys(payload).length === 0)
    ) {
      throw new BadRequestError('The body must contain the payload.');
    }

    const uuid = request.input.args.uuid || uuidv4();
    let valid = true;

    try {
      await decoder.validate(payload, request);
    }
    catch (error) {
      valid = false;
      throw error;
    }
    finally {
      await this.sdk.document.create(
        this.config.adminIndex,
        'payloads',
        {
          sensorModel: decoder.sensorModel,
          uuid,
          valid,
          payload,
        },
        uuid);
    }

    const sensorContent = await decoder.decode(payload, request);

    // Inject payload uuid
    for (const measure of Object.values(sensorContent.measures)) {
      if (! measure.payloadUuid) {
        measure.payloadUuid = uuid;
      }
    }
    if (! sensorContent.model) {
      sensorContent.model = decoder.sensorModel;
    }

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

      refreshableCollections.push([tenantId, 'sensors']);
    }

    // Propagate measures into linked asset
    const assetId = previousSensor._source.assetId;
    if (assetId) {
      const assetMeasures = await decoder.copyToAsset(enrichedSensor);

      const updatedAsset = await this.sdk.document.update(
        tenantId,
        'assets',
        assetId,
        { measures: assetMeasures },
        { source: true });

      // Historize
      await this.sdk.document.create(
        tenantId,
        'assets-history',
        updatedAsset._source,
        `${updatedAsset._id}_${request.id}`);

      refreshableCollections.push([tenantId, 'assets']);
      refreshableCollections.push([tenantId, 'assets-history']);
    }

    if (refresh === 'wait_for') {
      await Promise.all(refreshableCollections.map(([index, collection]) => (
        this.sdk.collection.refresh(index, collection)
      )));
    }

    return decoder.afterUpdate(enrichedSensor, request);
  }
}
