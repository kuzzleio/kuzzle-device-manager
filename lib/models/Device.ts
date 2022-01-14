import { JSONObject } from 'kuzzle';

import { DeviceContent } from '../types';

export class Device {
  static id (model: string, reference: string) {
    return `${model}.${reference}`;
  }
  public _id: string;
  public _source: DeviceContent;

  constructor (content: DeviceContent, _id?: string) {
    this._id = _id || Device.id(content.model, content.reference);

    this._source = {
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
    assetId: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
    engineId: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
    measures: {
      properties: {
        // measures mappings will be injected by the plugin
      }
    },
    metadata: {
      dynamic: 'false',
      properties: {},
    },
    model: {
      fields: {
        text: { type: 'text' },
      },
      type: 'keyword'
    },
    reference: {
      fields: {
        text: { type: 'text' },
      },
      type: 'keyword'
    }
  }
};
