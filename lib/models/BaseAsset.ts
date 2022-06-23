import { JSONObject } from 'kuzzle';
import { LinkRequest } from '../types/Request';

import { BaseAssetContent, DeviceLink, MeasureContent } from '../types';
import { Device } from './Device';

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

  public updateMeasures (measures: MeasureContent[]) {
    const measuresByName = new Map<string, MeasureContent>();

    for (const existingMeasure of this._source.measures) {
      measuresByName.set(existingMeasure.assetMeasureName, existingMeasure);
    }

    for (const measure of measures) {
      const existingMeasure = measuresByName.get(measure.assetMeasureName);

      if (! existingMeasure || existingMeasure.measuredAt < measure.measuredAt) {
        measuresByName.set(measure.assetMeasureName, measure);
      }
    }

    this._source.measures = Array.from(measuresByName.values());
  }

  public removeMeasures (assetMeasureNames: string[]) {
    const removed = [];
    const toKeep = [];

    for (const measure of this._source.measures) {
      const index = assetMeasureNames.indexOf(measure.assetMeasureName);
      if (0 <= index) {
        removed.push(measure);
        assetMeasureNames.splice(index, 1);
      }
      else {
        toKeep.push(measure);
      }
    }

    this._source.measures = toKeep;

    return {
      removed,
      notFound: assetMeasureNames,
    }
  }

  serialize (): JSONObject {
    return {
      _id: this._id,
      _source: this._source
    };
  }
}
