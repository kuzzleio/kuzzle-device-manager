import _ from 'lodash';
import {
  KuzzleRequest,
  PluginContext,
  BadRequestError,
  Plugin,
} from 'kuzzle';
import { v4 as uuidv4 } from 'uuid';

import { Decoder } from './Decoder';
import { Device, BaseAsset, Catalog } from '../models';
import { BatchController, BatchWriter } from './BatchProcessing';
import { ContextualMeasure, DeviceContent, DeviceManagerConfiguration } from '../types';
import { MeasuresRegister } from './registers/MeasuresRegister';

export class PayloadService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private batchController: BatchController;
  private measuresRegister: MeasuresRegister;

  private get sdk () {
    return this.context.accessors.sdk;
  }

  constructor (
    plugin: Plugin,
    batchWriter: BatchWriter,
    measuresRegister: MeasuresRegister
  ) {
    this.config = plugin.config as any;
    this.context = plugin.context;
    this.batchController = batchWriter.document;
    this.measuresRegister = measuresRegister;
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
          payload,
          uuid,
          valid,
        },
        uuid);
    }

    const decodedPayload = await decoder.decode(payload, request);

    const newMeasures: ContextualMeasure[] = [];

    const deviceId = Device.id(decoder.deviceModel, decodedPayload.reference);

    for (const [type, measure] of Object.entries(decodedPayload.measures)) {
      newMeasures.push({
        measuredAt: measure.measuredAt,
        origin: {
          id: deviceId,
          model: decoder.deviceModel,
          payloadUuids: [uuid],
          reference: decodedPayload.reference,
          type: 'device',
        },
        type,
        unit: this.measuresRegister.get(type).unit,
        values: measure.values
      });
    }

    try {
      const deviceDoc = await this.batchController.get(
        this.config.adminIndex,
        'devices',
        deviceId);

      const device = new Device(deviceDoc._source);

      return await this.update(device, newMeasures, { refresh });
    }
    catch (error) {
      if (error.id !== 'services.storage.not_found') {
        throw error;
      }

      const deviceContent: DeviceContent = {
        measures: newMeasures,
        model: decoder.deviceModel,
        reference: decodedPayload.reference,
      };

      return await this.deviceProvisioning(deviceId, deviceContent, { refresh });
    }
  }

  /**
   * Register a new device by creating the document in admin index
   * @todo add before/afterRegister events
   */
  private async register (deviceId: string, deviceContent: DeviceContent, { refresh }) {
    const deviceDoc = await this.batchController.create(
      this.config.adminIndex,
      'devices',
      deviceContent,
      deviceId,
      { refresh });

    const device = new Device(deviceDoc._source);

    return {
      asset: null,
      device: device.serialize(),
      engineId: device._source.engineId,
    };
  }

  /**
   * Device provisioning strategy.
   *
   * If provisioningStrategy is "auto," device is automatically registered, otherwise
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
  private async deviceProvisioning (
    deviceId: string,
    deviceContent: DeviceContent,
    { refresh }
  ) {
    const pluginConfig = await this.batchController.get(
      this.config.adminIndex,
      this.config.adminCollections.config.name,
      'plugin--device-manager');

    const autoProvisioning
      = pluginConfig._source['device-manager'].provisioningStrategy === 'auto';

    const catalogEntry = await this.getCatalogEntry(this.config.adminIndex, deviceId);

    if (! autoProvisioning && ! catalogEntry) {
      throw new BadRequestError(`Device "${deviceId}" is not provisioned.`);
    }

    if (! autoProvisioning && catalogEntry.content.authorized === false) {
      throw new BadRequestError(`Device "${deviceId}" is not allowed for registration.`);
    }

    const engineId = _.get(catalogEntry, 'content.engineId');

    const tenantCatalogEntry = engineId
      ? await this.getCatalogEntry(engineId, deviceId)
      : undefined;

    const { adminCatalog, tenantCatalog } = await global.app.trigger(
      'device-manager:device:provisioning:before',
      {
        adminCatalog: catalogEntry,
        deviceId,
        tenantCatalog: tenantCatalogEntry,
      });

    const { asset, device } = await this.register(
      deviceId,
      deviceContent,
      { refresh });

    // If there is not auto attachment to a tenant then we cannot link asset as well
    if (! engineId) {
      // Trigger event even if there is not engineId in the catalog
      await global.app.trigger('device-manager:device:provisioning:after', {
        adminCatalog,
        device,
        tenantCatalog,
      });

      return { asset, device, engineId };
    }

    await this.sdk.query({
      _id: deviceId,
      action: 'attachEngine',
      controller: 'device-manager/device',
      index: engineId,
    });

    if (adminCatalog.content.assetId) {
      await this.sdk.query({
        _id: deviceId,
        action: 'linkAsset',
        assetId: adminCatalog.content.assetId,
        controller: 'device-manager/device',
      });
    }


    if ( tenantCatalog
      && tenantCatalog.content.authorized !== false
      && tenantCatalog.content.assetId
    ) {
      await this.sdk.query({
        _id: deviceId,
        action: 'linkAsset',
        assetId: tenantCatalog.content.assetId,
        controller: 'device-manager/device',
      });
    }

    // Trigger event when there is a engineId in the catalog
    await global.app.trigger('device-manager:device:provisioning:after', {
      adminCatalog,
      deviceId,
      tenantCatalog,
    });

    return { asset, device, engineId };
  }

  /**
   * Get the device entry from the provisioning catalog in corresponding index
   */
  private async getCatalogEntry (index: string, deviceId: string): Promise<Catalog | null> {
    try {
      const document = await this.batchController.get(
        index,
        this.config.adminCollections.config.name,
        `catalog--${deviceId}`);

      return new Catalog(document);
    }
    catch (error) {
      if (error.id !== 'services.storage.not_found') {
        throw error;
      }

      const result = await this.sdk.document.search(
        index,
        this.config.adminCollections.config.name,
        {
          query: { equals: { 'catalog.deviceId': deviceId } },
        },
        { lang: 'koncorde', size: 1 });

      if (result.total !== 0) {
        return new Catalog(result.hits[0]);
      }

      return null;
    }
  }

  /**
   * Updates the device with the new measures:
   *  - in admin index
   *  - in engine index
   *  - in linked asset
   *  - historize measures in engine index
   *
   * @todo add before/afterUpdate events
   */
  private async update (
    device: Device,
    newMeasures: ContextualMeasure[],
    { refresh },
  ) {
    const refreshableCollections = [];

    const updatedDevice = await this.updateDevice(device, newMeasures);

    refreshableCollections.push([this.config.adminIndex, 'devices']);

    const engineId = updatedDevice._source.engineId;
    let updatedAsset: BaseAsset = null;

    // Propagate device into tenant index
    if (engineId) {
      await this.historizeMeasures(engineId, newMeasures);

      await this.batchController.update(
        engineId,
        'devices',
        updatedDevice._id,
        updatedDevice._source,
        { retryOnConflict: 10 });

      refreshableCollections.push([engineId, 'devices']);

      // Propagate measures into linked asset
      const assetId = updatedDevice._source.assetId;

      if (assetId) {
        updatedAsset = await this.propagateToAsset(engineId, newMeasures, assetId);

        refreshableCollections.push([engineId, 'assets']);
      }
    }

    if (refresh === 'wait_for') {
      await Promise.all(refreshableCollections.map(([index, collection]) => (
        this.sdk.collection.refresh(index, collection)
      )));
    }

    return {
      asset: updatedAsset ? updatedAsset.serialize() : null,
      device: device.serialize(),
      engineId,
    };
  }

  /**
   * Updates a device with the new measures
   *
   * @returns Updated device
   */
  private async updateDevice (
    device: Device,
    newMeasures: ContextualMeasure[],
  ): Promise<Device> {
    // dup array reference
    const measures = newMeasures.map(m => m);

    // Keep previous measures that were not updated
    for (const previousMeasure of device._source.measures) {
      if (! measures.find(m => m.type === previousMeasure.type)) {
        measures.push(previousMeasure);
      }
    }

    device._source.measures = measures;

    const result = await global.app.trigger(
      `engine:${device._source.engineId}:device:measures:new`,
      { device, measures: newMeasures });

    const deviceDocument = await this.batchController.update(
      this.config.adminIndex,
      'devices',
      result.device._id,
      result.device._source,
      { retryOnConflict: 10, source: true });

    return new Device(deviceDocument._source);
  }

  /**
   * Save measures in engine "measures" collection
   */
  private async historizeMeasures (engineId: string, measures: ContextualMeasure[]) {
    await Promise.all(measures.map(measure => {
      return this.batchController.create(engineId, 'measures', measure);
    }));
  }

  /**
   * Propagate the measures inside the linked asset document.
   */
  private async propagateToAsset (
    engineId: string,
    newMeasures: ContextualMeasure[],
    assetId: string
  ): Promise<BaseAsset> {
    // dup array reference
    const measures = newMeasures.map(m => m);

    const asset = await this.batchController.get(
      engineId,
      'assets',
      assetId);

    if (! _.isArray(asset._source.measures)) {
      throw new BadRequestError(`Asset "${assetId}" measures property is not an array.`);
    }

    // Keep previous measures that were not updated
    // array are updated in place so we need to keep previous elements
    for (const previousMeasure of asset._source.measures) {
      if (! measures.find(m => m.type === previousMeasure.type)) {
        measures.push(previousMeasure);
      }
    }

    asset._source.measures = measures;

    // Give the list of new measures types in event payload
    const result = await global.app.trigger(
      `engine:${engineId}:asset:measures:new`,
      { asset, measures: newMeasures });

    const assetDocument = await this.batchController.update(
      engineId,
      'assets',
      assetId,
      result.asset._source,
      { retryOnConflict: 10, source: true });

    return new BaseAsset(assetDocument._source as any, assetDocument._id);
  }
}
