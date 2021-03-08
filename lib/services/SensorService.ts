import {
  JSONObject,
  PluginContext,
  EmbeddedSDK,
  BadRequestError,
} from 'kuzzle';

import {
  MAttachTenantOptions,
  SensorBulkBuildedContent,
  SensorBulkContent,
  SensorMAttachementContent
} from 'lib/types';


import { Sensor } from '../models';
import { Decoder } from '../decoders';
export class SensorService {
  private config: JSONObject;
  private context: PluginContext;

  get sdk(): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  constructor(config: JSONObject, context: PluginContext) {
    this.config = config;
    this.context = context;
  }

  async mAttachTenant (sensors: Sensor[], bulkData: SensorBulkContent[], { strict } : MAttachTenantOptions): Promise<SensorMAttachementContent> {
    const attachedSensors = sensors.filter(sensor => sensor._source.tenantId);

    if (strict && attachedSensors.length > 0) {
      const ids = attachedSensors.map(sensor => sensor._id).join(',')
      throw new BadRequestError(`These sensors "${ids}" are already attached to a tenant`);
    }

    const documents = this.buildBulkSensors(bulkData);
    const results = {
      errors: [],
      successes: [],
    };

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      const tenantExists = await this.tenantExists(document.tenantId);

      if (strict && ! tenantExists) {
        throw new BadRequestError(`Tenant "${document.tenantId}" does not have a device-manager engine`);
      }
      else if (! strict && ! tenantExists) {
        results.errors.push(`Tenant "${document.tenantId}" does not have a device-manager engine`)
        continue;
      }

      const sensorDocuments = this.formatSensorsContent(sensors, document);

      const updated = await this.sdk.document.mUpdate(
        this.config.adminIndex,
        'sensors',
        sensorDocuments)

      const created = await this.sdk.document.mCreate(
        document.tenantId,
        'sensors',
        sensorDocuments)

      results.successes.push(...created.successes, ...updated.successes);
      results.errors.push(...created.errors, ...updated.errors);

    }

    return results;
  }

  async detach (sensor: Sensor) {
    if (! sensor._source.tenantId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is not attached to a tenant`);
    }

    if (sensor._source.assetId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is still linked to an asset`);
    }

    await this.sdk.document.delete(
      sensor._source.tenantId,
      'sensors',
      sensor._id);

    await this.sdk.document.update(
      this.config.adminIndex,
      'sensors',
      sensor._id,
      { tenantId: null });
  }


  async linkAsset (sensor: Sensor, assetId: string) {
    if (! sensor._source.tenantId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is not attached to a tenant`);
    }

    const assetExists = await this.sdk.document.exists(
      sensor._source.tenantId,
      'assets',
      assetId);

    if (! assetExists) {
      throw new BadRequestError(`Asset "${assetId}" does not exist`);
    }

    await this.sdk.document.update(
      this.config.adminIndex,
      'sensors',
      sensor._id,
      { assetId });

    await this.sdk.document.update(
      sensor._source.tenantId,
      'sensors',
      sensor._id,
      { assetId });

    if (!assetExists) {
      throw new BadRequestError(`Asset "${assetId}" does not exists`);
    }
  }

  async unlink (sensor: Sensor) {
    if (! sensor._source.assetId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is not linked to an asset`);
    }

    await this.sdk.document.update(
      this.config.adminIndex,
      'sensors',
      sensor._id,
      { assetId: null });

    await this.sdk.document.update(
      sensor._source.tenantId,
      'sensors',
      sensor._id,
      { assetId: null });

    // @todo only remove the measures coming from the unlinked sensor
    await this.sdk.document.update(
      sensor._source.tenantId,
      'assets',
      sensor._source.assetId,
      { measures: null });
  }

  private async tenantExists (tenantId: string) {
    const { result: tenantExists } = await this.sdk.query({
      controller: 'device-manager/engine',
      action: 'exists',
      index: tenantId,
    });

    return tenantExists;
  }

  private buildBulkSensors (bulkData: SensorBulkContent[]): SensorBulkBuildedContent[] {
    const documents: SensorBulkBuildedContent[] = [];

    for (let i = 0; i < bulkData.length; i++) {
      const line = bulkData[i];
      const document = documents.find(doc => doc.tenantId === line.tenantId);
      if (document) {
        document.sensorIds.push(line.sensorId);
      }
      else {
        documents.push({ tenantId: line.tenantId, sensorIds: [line.sensorId] })
      }
    }
    return documents;
  }

  private formatSensorsContent (sensors: Sensor[], document: SensorBulkBuildedContent) {
    const sensorsContent = sensors.filter(sensor => document.sensorIds.includes(sensor._id));
    const kuzDocuments = sensorsContent.map(sensor => {
      sensor._source.tenantId = document.tenantId;
      return { _id: sensor._id, body: sensor._source }
    });

    return kuzDocuments
  }

}
