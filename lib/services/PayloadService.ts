import {
  KuzzleRequest,
  JSONObject,
  PluginContext,
  EmbeddedSDK,
  BadRequestError,
} from 'kuzzle';
import { v4 as uuidv4 } from 'uuid';

import { Decoder } from '../decoders';
import { Device, BaseAsset } from '../models';

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
      await decoder.beforeProcessing(payload, request);
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
          deviceModel: decoder.deviceModel,
          uuid,
          valid,
          payload,
        },
        uuid);
    }

    const deviceContent = await decoder.decode(payload, request);

    // Inject payload uuid
    for (const measure of Object.values(deviceContent.measures)) {
      if (! measure.payloadUuid) {
        measure.payloadUuid = uuid;
      }
    }
    if (! deviceContent.model) {
      deviceContent.model = decoder.deviceModel;
    }

    const device = new Device(deviceContent);

    const exists = await this.sdk.document.exists(
      this.config.adminIndex,
      'devices',
      device._id);

    if (exists) {
      return this.update(device, decoder, request, { refresh });
    }

    return this.register(device, decoder, request, { refresh });
  }

  private async register (
    device: Device,
    decoder: Decoder,
    request: KuzzleRequest,
    { refresh }
  ) {
    const enrichedDevice = await decoder.beforeRegister(device, request);

    await this.sdk.document.create(
      this.config.adminIndex,
      'devices',
      enrichedDevice._source,
      enrichedDevice._id,
      { refresh });

    return decoder.afterRegister(enrichedDevice, request);
  }

  private async update (
    device: Device,
    decoder: Decoder,
    request: KuzzleRequest,
    { refresh }
  ) {
    const refreshableCollections = [];

    const previousDevice = await this.sdk.document.get(
      this.config.adminIndex,
      'devices',
      device._id);

    const enrichedDevice = await decoder.beforeUpdate(device, request);

    const deviceDocument = await this.sdk.document.update(
      this.config.adminIndex,
      'devices',
      enrichedDevice._id,
      enrichedDevice._source,
      { source: true });

    const updatedDevice = new Device(deviceDocument._source as any, deviceDocument._id);

    refreshableCollections.push([this.config.adminIndex, 'devices']);

    const tenantId = previousDevice._source.tenantId;
    // Propagate device into tenant index
    if (tenantId) {
      await this.sdk.document.update(
        tenantId,
        'devices',
        enrichedDevice._id,
        enrichedDevice._source);

      refreshableCollections.push([tenantId, 'devices']);
    }

    // Propagate measures into linked asset
    const assetId = previousDevice._source.assetId;
    let updatedAsset = null;

    if (assetId) {
      const assetMeasures = await decoder.copyToAsset(updatedDevice);

      const assetDocument = await this.sdk.document.update(
        tenantId,
        'assets',
        assetId,
        { measures: assetMeasures },
        { source: true });

      updatedAsset = new BaseAsset(assetDocument._source as any, assetDocument._id);

      refreshableCollections.push([tenantId, 'assets']);
    }

    if (refresh === 'wait_for') {
      await Promise.all(refreshableCollections.map(([index, collection]) => (
        this.sdk.collection.refresh(index, collection)
      )));
    }

    return decoder.afterUpdate(updatedDevice, updatedAsset, request);
  }
}
