import { JSONObject } from 'kuzzle';

import { BaseAssetContent } from '../types';

export class BaseAsset {
  public _id: string;
  public _source: BaseAssetContent;

  constructor (content: BaseAssetContent, _id?: string) {
    this._id = _id || `${content.type}.${content.model}.${content.reference}`;

    this._source = content;
  }

  serialize (): JSONObject {
    return {
      _id: this._id,
      _source: this._source
    };
  }
}

export const assetsMappings = {
  dynamic: 'strict',
  properties: {
    measures: {
      properties: {
        // autogenerated from devices mappings
      }
    },
    metadata: {
      dynamic: 'false',
      properties: {}
    },
    model: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
    reference: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    },
    type: {
      fields: {
        text: { type: 'text' }
      },
      type: 'keyword'
    }
  }
};

export const assetsHistoryMappings = {
  dynamic: 'strict',
  properties: {
    // Will be replaced by the custom asset mappings
    asset: null,

    assetId: { type: 'keyword' },


    measureTypes: { type: 'keyword' },
  }
};
