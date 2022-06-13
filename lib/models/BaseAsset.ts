import { JSONObject } from 'kuzzle';

import { BaseAssetContent } from '../types';

export class BaseAsset {
  static id (type: string, model: string, reference: string) {
    return `${type}-${model}-${reference}`;
  }

  public _id: string;
  public _source: BaseAssetContent;

  constructor (content: BaseAssetContent, _id?: string) {
    this._id = _id || BaseAsset.id(content.type, content.model, content.reference);

    this._source = content;

    if (! Array.isArray(this._source.measures)) {
      this._source.measures = [];
    }
  }

  public linkToDevice (linkRequest: LinkRequest) {
    this._source.deviceLinks.push(linkRequest.deviceLink);
  }

  public unlinkDevice (device: Device) {
    // TOSEE : Iterate over all or assert there is
    // only one link and remove first match?
    const linkToKeep = this._source.deviceLinks.filter(
      (deviceLink: DeviceLink) => deviceLink.deviceId !== device._id);

    this._source.deviceLinks = linkToKeep;
  }

  serialize (): JSONObject {
    return {
      _id: this._id,
      _source: this._source
    };
  }
}
