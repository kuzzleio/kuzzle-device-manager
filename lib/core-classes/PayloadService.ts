import _ from 'lodash';
import {
  KuzzleRequest,
  JSONObject,
  PluginContext,
  EmbeddedSDK,
  BadRequestError,
  Plugin,
} from 'kuzzle';
import { v4 as uuidv4 } from 'uuid';

import { Decoder } from './Decoder';
import { Device, BaseAsset, Catalog } from '../models';
import { BatchController, BatchWriter } from './BatchProcessing';
import { eventPayload } from '../utils';
import { DeviceManagerConfig } from '../DeviceManagerPlugin';

export type PayloadHandler = (request: KuzzleRequest, decoder: Decoder) => Promise<any>;

export class PayloadService {
  private config: DeviceManagerConfig;
  private context: PluginContext;
  private batchController: BatchController;

  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor (plugin: Plugin, batchWriter: BatchWriter) {
    this.config = plugin.config as any;
    this.context = plugin.context;
    this.batchController = batchWriter.document;
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
      valid = await decoder.validate(payload, request);

      if (! valid) {
        return { valid };
      }

      await decoder.beforeProcessing(payload, request);
    }
    catch (error) {
      valid = false;
      throw error;
    }
    finally {
      await this.batchController.create(
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

    const exists = await this.batchController.exists(
      this.config.adminIndex,
      'devices',
      device._id);

    if (exists) {
      return await this.update(device, decoder, request, { refresh });
    }

    return await this.deviceProvisionning(device, decoder, request, { refresh });
  }

  private async register (
    device: Device,
    decoder: Decoder,
    request: KuzzleRequest,
    { refresh }
  ): Promise<JSONObject> {
    const enrichedDevice = await decoder.beforeRegister(device, request);

    await this.batchController.create(
      this.config.adminIndex,
      'devices',
      enrichedDevice._source,
      enrichedDevice._id,
      { refresh });

    return await decoder.afterRegister(enrichedDevice, request);
  }

  /**
   * Device provisioning strategy.
   *
   * If autoProvisionning is on, device is automatically registered, otherwise
   * we request the admin provisioning catalog to ensure this device is allowed
   * to register.
   *
   * After registration, we look at the admin provisioning catalog entry to:
   *   - attach the device to a tenant
   *   - link the device to an asset of this tenant
   *
   * Then we look into the tenant provisioning catalog entry to:
   *   - link the device to an asset of this tenant
   */
  private async deviceProvisionning (
    device: Device,
    decoder: Decoder,
    request: KuzzleRequest,
    { refresh }
  ): Promise<JSONObject> {
    const pluginConfigDocument = await this.batchController.get(
      this.config.adminIndex,
      this.config.configCollection,
      'plugin--device-manager');

    const autoProvisionning: boolean = pluginConfigDocument._source['device-manager'].autoProvisionning;

    const catalogEntry = await this.getCatalogEntry(this.config.adminIndex, device._id);

    if (! autoProvisionning && ! catalogEntry) {
      throw new BadRequestError(`Device ${device._id} is not provisionned.`);
    }

    if (! autoProvisionning && catalogEntry.content.authorized === false) {
      throw new BadRequestError(`Device ${device._id} is not allowed for registration.`);
    }

    const ret = await this.register(device, decoder, request, { refresh });

    // If there is not auto attachment to a tenant then we cannot link asset as well
    if (! catalogEntry || ! catalogEntry.content.tenantId) {
      return ret;
    }

    await this.sdk.query({
      controller: 'device-manager/device',
      action: 'attachTenant',
      _id: device._id,
      index: catalogEntry.content.tenantId,
    });

    if (catalogEntry.content.assetId) {
      await this.sdk.query({
        controller: 'device-manager/device',
        action: 'linkAsset',
        _id: device._id,
        assetId: catalogEntry.content.assetId,
      });
    }

    const tenantCatalogEntry = await this.getCatalogEntry(
      catalogEntry.content.tenantId,
      device._id);

    if ( tenantCatalogEntry
      && tenantCatalogEntry.content.authorized !== false
      && tenantCatalogEntry.content.assetId
    ) {
      await this.sdk.query({
        controller: 'device-manager/device',
        action: 'linkAsset',
        _id: device._id,
        assetId: tenantCatalogEntry.content.assetId,
      });
    }

    return ret;
  }

  /**
   * Get the device entry from the provisioning catalog in corresponding index
   */
  private async getCatalogEntry (index: string, deviceId: string): Promise<Catalog | null> {
    try {
      const document = await this.batchController.get(
        index,
        this.config.configCollection,
        `catalog--${deviceId}`);

      return new Catalog(document);
    }
    catch (error) {
      if (error.id !== 'services.storage.not_found') {
        throw error;
      }

      return null;
    }
  }

  private async update (
    device: Device,
    decoder: Decoder,
    request: KuzzleRequest,
    { refresh }
  ) {
    const refreshableCollections = [];

    const previousDevice = await this.batchController.get(
      this.config.adminIndex,
      'devices',
      device._id);

    const enrichedDevice = await decoder.beforeUpdate(device, request);

    const deviceDocument = await this.batchController.update(
      this.config.adminIndex,
      'devices',
      enrichedDevice._id,
      enrichedDevice._source,
      { source: true, retryOnConflict: 10 });

    const updatedDevice = new Device(deviceDocument._source as any, deviceDocument._id);

    refreshableCollections.push([this.config.adminIndex, 'devices']);

    const tenantId = previousDevice._source.tenantId;
    let updatedAsset: BaseAsset = null;

    // Propagate device into tenant index
    if (tenantId) {
      await this.batchController.update(
        tenantId,
        'devices',
        enrichedDevice._id,
        enrichedDevice._source,
        { retryOnConflict: 10 });

      refreshableCollections.push([tenantId, 'devices']);

      // Propagate measures into linked asset
      const assetId = previousDevice._source.assetId;

      if (assetId) {
        updatedAsset = await this.propagateToAsset(
          tenantId,
          decoder,
          updatedDevice,
          assetId);

        await this.historizeAsset(tenantId, updatedAsset)

        refreshableCollections.push([tenantId, 'assets']);
      }
    }

    if (refresh === 'wait_for') {
      await Promise.all(refreshableCollections.map(([index, collection]) => (
        this.sdk.collection.refresh(index, collection)
      )));
    }

    return decoder.afterUpdate(updatedDevice, updatedAsset, request);
  }

  /**
   * Propagate the measures inside the asset document.
   */
  private async propagateToAsset (
    tenantId: string,
    decoder: Decoder,
    updatedDevice: Device,
    assetId: string
  ): Promise<BaseAsset> {
    const measures = await decoder.copyToAsset(updatedDevice);

    const measureTypes = Object.keys(measures);

    const asset = await this.batchController.get(
      tenantId,
      'assets',
      assetId);

    asset._source.measures = _.merge(asset._source.measures, measures);

    const { result } = await global.app.trigger(
      `tenant:${tenantId}:asset:propagation:before`,
      eventPayload({ asset, measureTypes }));

    const assetDocument = await this.batchController.update(
      tenantId,
      'assets',
      assetId,
      result.asset._source,
      { source: true, retryOnConflict: 10 });

    return new BaseAsset(assetDocument._source as any, assetDocument._id);
  }

  /**
   * Creates an history entry for an asset
   */
  private async historizeAsset (tenantId: string, asset: BaseAsset) {
    const measureTypes = Object.keys(asset._source.measures);

    const { result } = await global.app.trigger(
      `tenant:${tenantId}:asset:historization:before`,
      eventPayload({ asset, measureTypes, historize: true }));

    if (result.historize === false) {
      this.context.log.debug(`[${tenantId}] Historization skipped for asset "${asset._id}"`);
      return;
    }

    await this.batchController.create(
      tenantId,
      'asset-history',
      {
        assetId: asset._id,
        measureTypes: Object.keys(asset._source.measures),
        asset: _.omit(asset._source, ['_kuzzle_info']),
      }
    );
  }
}
