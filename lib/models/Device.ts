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
      ...content
    };
  }

  serialize (): JSONObject {
    return {
      _id: this._id,
      _source: this._source
    };
  }
}

export const devicesMappings = {
  dynamic: 'strict',
  properties: {
    reference: {
      type: 'keyword',
      fields: {
        text: { type: 'text' }
      }
    },
    model: {
      type: 'keyword',
      fields: {
        text: { type: 'text' }
      }
    },
    measures: {
      properties: {
        // measures mappings will be injected by the plugin
      }
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
        text: { type: 'text' }
      }
    },
    tenantId: {
      type: 'keyword',
      fields: {
        text: { type: 'text' }
      }
    }
  }
};
