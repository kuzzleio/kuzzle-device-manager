import {
  JSONObject,
  PluginContext,
  EmbeddedSDK,
  BadRequestError,
} from 'kuzzle';

import { Sensor } from '../models';
import { Decoder } from '../decoders';
import { SensorBulkBuildedContent, SensorBulkContent, SensorMAttachementContent } from 'lib/types';

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

  async mAttachTenant (sensors: Sensor[], bulkData: SensorBulkContent[], isStrict: boolean): Promise<SensorMAttachementContent> {
    const attachedSensors = this.assertSensorsNotAttached(sensors);

    if (isStrict && attachedSensors.length > 0) {
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
      const tenantExists = await this.assertTenantExists(document.tenant);

      if (isStrict && ! tenantExists) {
        throw new BadRequestError(`Tenant "${document.tenant}" does not have a device-manager engine`);
      }
      else if (! isStrict && ! tenantExists) {
        results.errors.push(`Tenant "${document.tenant}" does not have a device-manager engine`)
        continue;
      }

      const kuzDocuments = this.formatSensorsContent(sensors, document);

      const updated = await this.sdk.document.mUpdate(
        this.config.adminIndex,
        'sensors',
        kuzDocuments
      )

      const created = await this.sdk.document.mCreate(
        document.tenant,
        'sensors',
        kuzDocuments
      )

      results.successes.push(...created.successes, ...updated.successes);
      results.errors.push(...created.errors, ...updated.errors);

    }

    return results;
  }

  async mDetach (sensors: Sensor[], bulkData: SensorBulkContent[], isStrict: boolean) {
    const documents = this.buildBulkSensors(bulkData);
    const results = {
      errors: [],
      successes: [],
    };

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];

      const sensorsContent = sensors.filter(sensor => document.id.includes(sensor._id));
      const kuzDocuments = sensorsContent.map(sensor => {
        if (! sensor._source.tenantId) {
          throw new BadRequestError(`Sensor "${sensor._id}" is not attached to a tenant`);
        }

        if (sensor._source.assetId) {
          throw new BadRequestError(`Sensor "${sensor._id}" is still linked to an asset`);
        }

        sensor._source.tenantId = document.tenant;
        return { _id: sensor._id, body: { tenantId: null } }
      })

      const deleted = await this.sdk.document.mDelete(
        document.tenant,
        'sensors',
        document.id,
      )

      const updated = await this.sdk.document.mUpdate(
        this.config.adminIndex,
        'sensors',
        kuzDocuments,
      )

      results.successes.push(...deleted.successes, ...updated.successes);
      results.errors.push(...deleted.errors, ...updated.errors);
    }
    

  }


  async linkAsset (sensor: Sensor, assetId: string, decoders: Map<string, Decoder>) {
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

    const decoder = decoders.get(sensor._source.model);

    const assetMeasures = await decoder.copyToAsset(sensor);

    await this.sdk.document.update(
      sensor._source.tenantId,
      'assets',
      assetId,
      { measures: assetMeasures });
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

  private async assertTenantExists (tenantId: string) {
    const { result: tenantExists } = await this.sdk.query({
      controller: 'device-manager/engine',
      action: 'exists',
      index: tenantId,
    });

    return tenantExists;
  }

  private buildBulkSensors (bulkData: SensorBulkContent[]): SensorBulkBuildedContent[] {
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

  private assertSensorsNotAttached (sensors: Sensor[]) {
    return sensors.filter(sensor => sensor._source.tenantId);
  }

  private formatSensorsContent (sensors: Sensor[], document: SensorBulkBuildedContent) {
    const sensorsContent = sensors.filter(sensor => document.id.includes(sensor._id));
    const kuzDocuments = sensorsContent.map(sensor => {
      sensor._source.tenantId = document.tenant;
      return { _id: sensor._id, body: sensor._source }
    });

    return kuzDocuments
  }

}
