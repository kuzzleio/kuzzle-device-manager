import { LinkRequest } from 'lib/types/Request';
import { DeviceContent, MeasureContent } from '../types';

export class Device {
  static id (model: string, reference: string) {
    return `${model}-${reference}`;
  }

  public _id: string;
  public _source: DeviceContent;

  constructor (content: DeviceContent, _id?: string) {
    this._id = _id || Device.id(content.model, content.reference);

    this._source = {
      metadata: {},
      ...content
    };

    if (! Array.isArray(this._source.measures)) {
      this._source.measures = [];
    }
  }

  serialize (): { _id: string, _source: DeviceContent } {
    return {
      _id: this._id,
      _source: this._source
    };
  }
  
  public linkToAsset (linkRequest: LinkRequest) {
    this._source.assetId = linkRequest.assetId;
  }

  public updateMeasures (measures: MeasureContent[]) {
    const measuresByName: Map<string, MeasureContent> = new Map();

    for (const measure of this._source.measures) {
      measuresByName.set(measure.deviceMeasureName, measure);
    }

    for (const measure of measures) {
      const existingMeasure = measuresByName.get(measure.deviceMeasureName);
      if (existingMeasure) {
        if (existingMeasure.measuredAt < measure.measuredAt) {
          measuresByName.set(measure.deviceMeasureName, measure);
        }
      }
      else {
        measuresByName.set(measure.deviceMeasureName, measure);
      }
    }

    this._source.measures = Array.from(measuresByName.values());
  }
}
