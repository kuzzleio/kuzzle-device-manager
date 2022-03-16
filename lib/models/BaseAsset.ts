import { JSONObject } from 'kuzzle';

import { BaseAssetContent } from '../types';

export class BaseAsset {
  public _id: string;
  public _source: BaseAssetContent;

  constructor (content: BaseAssetContent, _id?: string) {
    this._id = _id || `${content.type}-${content.model}-${content.reference}`;

    this._source = content;
  }

  serialize (): JSONObject {
    return {
      _id: this._id,
      _source: this._source
    };
  }
}
