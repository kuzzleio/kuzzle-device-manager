import {
  JSONObject,
  PluginContext,
  EmbeddedSDK,
  BadRequestError,
} from 'kuzzle';

import { Sensor } from '../models';
import { Decoder } from '../decoders';
import { SensorBulkBuildedContent, SensorBulkContent } from 'lib/types';

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

  async attachTenant(sensor: Sensor, tenantId: string) {
    if (sensor._source.tenantId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is already attached to a tenant`);
    }

    const tenantExists = await this.assertTenantExists(tenantId);
    if (!tenantExists) {
      throw new BadRequestError(`Tenant "${tenantId}" does not have a device-manager engine`);
    }

    sensor._source.tenantId = tenantId;

    await this.sdk.document.update(
      this.config.adminIndex,
      'sensors',
      sensor._id,
      sensor._source);

    await this.sdk.document.create(
      tenantId,
      'sensors',
      sensor._source,
      sensor._id);
  }

  async mAttachTenant(sensors: Sensor[], bulkData: SensorBulkContent[]) {
    for (let i = 0; i < sensors.length; i++) {
      const sensor = sensors[i];
      if (sensor._source.tenantId) {
        throw new BadRequestError(`Sensor "${sensor._id}" is already attached to a tenant`);
      }
    }

    const documents = this.buildBulkSensors(bulkData);

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      const tenantExists = await this.assertTenantExists(document.tenant);

      if (!tenantExists) {
        throw new BadRequestError(`Tenant "${document.tenant}" does not have a device-manager engine`);
      }


      const sensorsContent = sensors.filter(sensor => document.id.includes(sensor._id));
      const kuzDocuments = sensorsContent.map(sensor => {
        sensor._source.tenantId = document.tenant;
        return { _id: sensor._id, body: sensor._source }
      })


      await this.sdk.document.mUpdate(
        this.config.adminIndex,
        'sensors',
        kuzDocuments
      )

      await this.sdk.document.mCreate(
        document.tenant,
        'sensors',
        kuzDocuments
      )
    }
  }

  async detach(sensor: Sensor) {
    if (!sensor._source.tenantId) {
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


  async linkAsset(sensor: Sensor, assetId: string, decoders: Map<string, Decoder>) {
    if (!sensor._source.tenantId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is not attached to a tenant`);
    }

    const assetExists = await this.sdk.document.exists(
      sensor._source.tenantId,
      'assets',
      assetId);

    if (!assetExists) {
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

    const decoder = decoders.get(sensor._source.model);

    const assetMeasures = await decoder.copyToAsset(sensor);

    await this.sdk.document.update(
      sensor._source.tenantId,
      'assets',
      assetId,
      { measures: assetMeasures });
  }

  async unlink(sensor: Sensor) {
    if (!sensor._source.assetId) {
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

  private async assertTenantExists(tenantId: string) {
    const { result: tenantExists } = await this.sdk.query({
      controller: 'device-manager/engine',
      action: 'exists',
      index: tenantId,
    });

    return tenantExists;
  }

  private buildBulkSensors(bulkData: SensorBulkContent[]): SensorBulkBuildedContent[] {
    const documents = []
    for (let i = 0; i < bulkData.length; i++) {
      const line = bulkData[i];
      const document = documents.find(doc => doc.tenant === line.tenant);
      if (document) {
        document.id.push(line.id);
      }
      else {
        documents.push({ tenant: line.tenant, id: [line.id] })
      }
    }
    return documents;
  }

}
