import { JSONObject } from 'kuzzle';

import { DeviceContent } from '../types';

export class Device {
  _id: string;
  _source: DeviceContent;

  constructor (content: DeviceContent, _id?: string) {
    this._id = _id || `${content.model}-${content.reference}`;

    this._source = {
      qos: {},
      metadata: {},
      ...content,
    };
  }

  serialize (): JSONObject {
    return {
      _id: this._id,
      _source: this._source,
    };
  }
}

export const devicesMappings = {
  dynamic: 'strict',
  properties: {
    reference: {
      type: 'keyword',
      fields: {
        text: { type: 'text' },
      },
    },
    model: {
      type: 'keyword',
      fields: {
        text: { type: 'text' },
      },
    },
    measures: {
      properties: {
        temperature: {
          properties: {
            // common
            updatedAt: { type: 'date' },
            payloadUuid: {
              type: 'keyword',
              fields: {
                text: { type: 'text' },
              },
            },
            // temperature
            degree: { type: 'float' },
          },
        },
        position: {
          properties: {
            // common
            updatedAt: { type: 'date' },
            payloadUuid: {
              type: 'keyword',
              fields: {
                text: { type: 'text' },
              },
            },
            // position
            point: { type: 'geo_point' },
            altitude: { type: 'float' },
            accuracy: { type: 'integer' },
          },
        },
        movement: {
          properties: {
            // common
            payloadUuid: {
              type: 'keyword',
              fields: {
                text: { type: 'text' },
              },
            },
            updatedAt: { type: 'date' },
            // movement state
            moving: { type: 'boolean' },
          },
        },
      },
    },
    qos: {
      dynamic: 'false',
      properties: {},
    },
    metadata: {
      dynamic: 'false',
      properties: {},
    },
    assetId: {
      type: 'keyword',
      fields: {
        text: { type: 'text' },
      },
    },
    tenantId: {
      type: 'keyword',
      fields: {
        text: { type: 'text' },
      },
    },
  },
};
