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
    reference: {
      type: 'keyword',
      fields: {
        text: { type: 'text' },
      }
    },
    model: {
      type: 'keyword',
      fields: {
        text: { type: 'text' },
      }
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
    assetId: {
      type: 'keyword',
      fields: {
        text: { type: 'text' }
      }
    },
    engineId: {
      type: 'keyword',
      fields: {
        text: { type: 'text' }
      }
    }
  }
};
