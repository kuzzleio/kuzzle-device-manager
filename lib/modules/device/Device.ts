import { JSONObject } from "kuzzle-sdk";

import { MeasureContent } from "./../measure";
import { LinkRequest } from "./../asset";

import { DeviceContent } from "./types/DeviceContent";

export class Device {
  static id(model: string, reference: string) {
    return `${model}-${reference}`;
  }

  public _id: string;
  public _source: DeviceContent;

  constructor(content: DeviceContent, _id?: string) {
    this._id = _id || Device.id(content.model, content.reference);

    this._source = {
      metadata: [],
      ...content,
    };

    if (!Array.isArray(this._source.measures)) {
      this._source.measures = [];
    }
  }

  serialize(): { _id: string; _source: DeviceContent } {
    return {
      _id: this._id,
      _source: this._source,
    };
  }

  public unlinkToAsset() {
    this._source.assetId = null;
  }

  public linkToAsset(linkRequest: LinkRequest) {
    this._source.assetId = linkRequest.assetId;
  }

  /**
   * Updates the asset measures.
   *
   * Only keep the latest measures
   */
  public updateMeasures(newMeasures: MeasureContent[]) {
    for (const newMeasure of newMeasures) {
      const idx = this._source.measures.findIndex(
        (measure) => measure.deviceMeasureName === newMeasure.deviceMeasureName
      );

      if (idx === -1) {
        this._source.measures.push(newMeasure);
      } else if (
        newMeasure.measuredAt > this._source.measures[idx].measuredAt
      ) {
        this._source.measures[idx] = newMeasure;
      }
    }
  }

  public updateMetadata(metadata: JSONObject) {
    this._source.metadata = this._source.metadata.concat(metadata);
  }
}
