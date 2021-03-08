import { JSONObject } from 'kuzzle';

import { SensorContent } from '../types';

export class Sensor {
  _id: string;
  _source: SensorContent;

  constructor (content: SensorContent, _id?: string) {
    this._id = _id || `${content.model}_${content.reference}`;

    this._source = {
      qos: {},
      metadata: {},
      ...content,
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
            degree: { type: 'float' },
          }
        },
        position: {
          properties: {
            // common
            updatedAt: { type: 'date' },
            payloadUuid: { type: 'keyword' },
            // position
            point: { type: 'geo_point' },
            altitude: { type: 'float' },
            accuracy: { type: 'integer' },
          }
        },
        movement: {
          properties: {
            // common
            payloadUuid: { type: 'keyword' },
            updatedAt: { type: 'date' },
            // movement state
            moving: { type: 'boolean' },
          }
        },
      }
    },
    qos: {
      dynamic: 'false',
      properties: {}
    },
    metadata: {
      dynamic: 'false',
      properties: {}
    },
    assetId: { type: 'keyword' },
    tenantId: { type: 'keyword' }
  }
};
