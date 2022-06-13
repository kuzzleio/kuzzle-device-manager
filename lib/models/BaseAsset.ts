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

  public unlinkToDevice (device: Device) {
    const { linkToKeep, linkToRemove } = asset._source.deviceLinks.reduce(
      ({ linkToKeep, linkToRemove }, deviceLink: DeviceLink) => {
        if (deviceLink.deviceId === device._id) {
          linkToRemove.push(deviceLink);
        }
        else {
          linkToKeep.push(deviceLink);
        }
        return { linkToKeep, linkToRemove };
      },
      { linkToKeep: [], linkToRemove: [] });

    asset._source.deviceLinks = linkToKeep;

  }

  serialize (): JSONObject {
    return {
      _id: this._id,
      _source: this._source
    };
  }
}
