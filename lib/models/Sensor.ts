import { JSONObject } from 'kuzzle';

import { SensorContent } from '../types';

export class Sensor {
  _id: string;
  _source: SensorContent;

  constructor (sensorContent: SensorContent, _id?: string) {
    this._id = _id || `${sensorContent.model}/${sensorContent.reference}`;

    this._source = {
      metadata: {},
      ...sensorContent,
    };
  }

  serialize (): JSONObject {
    return {
      _id: this._id,
      _source: this._source
    };
  }
}

export const sensorsMappings = {
  dynamic: 'strict',
  properties: {
    reference: { type: 'keyword' },
    model: { type: 'keyword' },
    measures: {
      properties: {
        temperature: {
          properties: {
            // common
            updatedAt: { type: 'date' },
            payloadUuid: { type: 'keyword' },
            // temperature
            value: { type: 'float' },
          }
        },
        position: {
          properties: {
            // common
            updatedAt: { type: 'date' },
            payloadUuid: { type: 'keyword' },
            // position
            latitude: { type: 'float' },
            longitude: { type: 'float' },
            altitude: { type: 'float' },
            accuracy: { type: 'integer' },
          }
        },
      }
    },
    metadata: {
      dynamic: 'false',
      properties: {}
    },
    assetId: { type: 'keyword' },
    tenantId: { type: 'keyword' }
  }
}
