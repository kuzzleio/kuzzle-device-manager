import { JSONObject } from 'kuzzle';
import { LinkRequest } from '../types/Request';

import { BaseAssetContent, MeasureContent } from '../types';
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

    if (! Array.isArray(this._source.deviceLinks)) {
      this._source.deviceLinks = [];
    }
  }

  public linkToDevice (linkRequest: LinkRequest) {
    this._source.deviceLinks.push(linkRequest.deviceLink);
  }

  public unlinkDevice (device: Device) {
    // TOSEE : Iterate over all or assert there is
    // only one link and remove first match?
    const linkToKeep = this._source.deviceLinks.filter(link => link.deviceId !== device._id);

    this._source.deviceLinks = linkToKeep;
  }

  /**
   * Updates the asset measures.
   *
   * Only keep the latest measures
   */
  public updateMeasures (newMeasures: MeasureContent[]) {
    for (const newMeasure of newMeasures) {
      const idx = this._source.measures.findIndex(measure => measure.assetMeasureName === newMeasure.assetMeasureName);

      if (idx === -1) {
        this._source.measures.push(newMeasure);
      }
      else if (newMeasure.measuredAt > this._source.measures[idx].measuredAt) {
        this._source.measures[idx] = newMeasure;
      }
    }
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
      notFound: assetMeasureNames,
      removed,
    };
  }

  serialize (): JSONObject {
    return {
      _id: this._id,
      _source: this._source
    };
  }
}
