import {
  JSONObject,
  PluginContext,
  EmbeddedSDK,
  BadRequestError,
} from 'kuzzle';

import {
  SensorBulkBuildedContent,
  SensorBulkContent,
  SensorMAttachementContent,
  SensorMRequestContent
} from '../types';

import { Decoder } from '../decoders';
import { Sensor } from '../models';
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

  async mAttachTenant (sensors: Sensor[], bulkData: SensorBulkContent[], { strict }): Promise<SensorMAttachementContent> {
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

      const { errors, successes } = await this.writeToDatabase(
        sensorDocuments,
        async (sensorDocuments: SensorMRequestContent[]): Promise<JSONObject> => {
          const updated = await this.sdk.document.mUpdate(
            this.config.adminIndex,
            'sensors',
            sensorDocuments);
    
          await this.sdk.document.mCreate(
            document.tenantId,
            'sensors',
            sensorDocuments);
  
            return {
              successes: results.successes.concat(updated.successes),
              errors: results.errors.concat(updated.errors)
            }
        });

      results.successes.concat(successes);
      results.errors.concat(errors);
    }

    return results;
  }

  async mDetach (sensors: Sensor[], bulkData: SensorBulkContent[], isStrict: boolean) {
    const detachedSensors = sensors.filter(sensor => !sensor._source.tenantId || sensor._source.tenantId === null);

    if (isStrict && detachedSensors.length > 0) {
      const ids = detachedSensors.map(sensor => sensor._id).join(',')
      throw new BadRequestError(`Sensors "${ids}" are not attached to a tenant`);
    }

    const linkedAssets = sensors.filter(sensor => sensor._source.assetId);

    if (isStrict && linkedAssets.length > 0) {
      const ids = linkedAssets.map(sensor => sensor._id).join(',')
      throw new BadRequestError(`Sensors "${ids}" are still linked to an asset`);
    }

    const documents = this.buildBulkSensors(bulkData);
    const results = {
      errors: [],
      successes: [],
    };

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];

      const sensorsContent = sensors.filter(sensor => document.sensorIds.includes(sensor._id));
      const sensorDocuments = sensorsContent.map(sensor => {
        return { _id: sensor._id, body: { tenantId: null } }
      })

      const { errors, successes } = await this.writeToDatabase(
        sensorDocuments,
        async (sensorDocuments: SensorMRequestContent[]): Promise<JSONObject> => {

        const updated = await this.sdk.document.mUpdate(
          this.config.adminIndex,
          'sensors',
          sensorDocuments);
          
          console.log('AAAA', sensorDocuments, document.tenantId);

          await this.sdk.document.mDelete(
            document.tenantId,
            'sensors',
            sensorDocuments.map(sensor => sensor._id));

          return {
            successes: results.successes.concat(updated.successes),
            errors: results.errors.concat(updated.errors)
          }
      })

      results.successes.concat(successes);
      results.errors.concat(errors);
    }
  }


  async linkAsset (sensor: Sensor, assetId: string, decoders: Map<string, Decoder>) {
    if (!sensor._source.tenantId) {
      throw new BadRequestError(`Sensor "${sensor._id}" is not attached to a tenant`);
    }
  
    const assetExists = await this.sdk.document.exists(
      sensor._source.tenantId,
      'assets',
      assetId);
  
    if (!assetExists) {
      throw new BadRequestError(`Asset "${assetId}" does not exists`);
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
      const { tenantId, sensorId } = bulkData[i];
      const document = documents.find(doc => doc.tenantId === tenantId);

      if (document) {
        document.sensorIds.push(sensorId);
      }
      else {
        documents.push({ tenantId, sensorIds: [sensorId] })
      }
    }
    return documents;
  }

  private formatSensorsContent (sensors: Sensor[], document: SensorBulkBuildedContent): SensorMRequestContent[] {
    const sensorsContent = sensors.filter(sensor => document.sensorIds.includes(sensor._id));
    const sensorsDocuments = sensorsContent.map(sensor => {
      sensor._source.tenantId = document.tenantId;
      return { _id: sensor._id, body: sensor._source }
    });

    return sensorsDocuments;
  }

  private async writeToDatabase (sensorDocuments: SensorMRequestContent[], writer: (sensorDocuments: SensorMRequestContent[]) => Promise<JSONObject>) {
    const results = {
      errors: [],
      successes: [],
    }

    const limit = global.kuzzle.config.limits.documentsWriteCount;

    if (sensorDocuments.length <= limit) {
      const { successes, errors } = await writer(sensorDocuments);
      results.successes.push(successes);
      results.errors.push(errors);

      return results;
    }

    const writeMany = async (start: number, end: number) => {
      const sensors = sensorDocuments.slice(start, end);
      const { successes, errors } = await writer(sensors);

      results.successes.push(successes);
      results.errors.push(errors);
    }

    let offset = 0;
    let offsetLimit = limit;
    let done = false;

    while (! done) {
      await writeMany(offset, offsetLimit)

      offset += limit;
      offsetLimit += limit;

      if (offsetLimit >= sensorDocuments.length) {
        done = true;
        await writeMany(offset, sensorDocuments.length);
      }
    }

    return results;
  }
}
