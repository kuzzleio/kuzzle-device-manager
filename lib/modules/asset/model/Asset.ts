import _ from "lodash";

import { MeasureContent } from "../../measure";

import { AssetContent } from "../types/AssetContent";
import { AssetSerializer } from "./AssetSerializer";

export class Asset<TAssetContent extends AssetContent = AssetContent> {
  public _id: string;
  public _source: TAssetContent;

  constructor(content: TAssetContent, _id?: string) {
    this._id = _id || AssetSerializer.id(content.model, content.reference);

    this._source = content;

    if (!Array.isArray(this._source.measures)) {
      this._source.measures = [];
    }

    if (!Array.isArray(this._source.deviceLinks)) {
      this._source.deviceLinks = [];
    }

    if (!_.isObject(this._source.metadata)) {
      this._source.metadata = {};
    }
  }

  /**
   * Updates the asset measures.
   *
   * Only keep the latest measures
   */
  public updateMeasures(newMeasures: MeasureContent[]) {
    for (const newMeasure of newMeasures) {
      const idx = this._source.measures.findIndex(
        (measure) => measure.assetMeasureName === newMeasure.assetMeasureName
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

  public removeMeasures(assetMeasureNames: string[]) {
    const removed = [];
    const toKeep = [];

    for (const measure of this._source.measures) {
      const index = assetMeasureNames.indexOf(measure.assetMeasureName);
      if (index >= 0) {
        removed.push(measure);
        assetMeasureNames.splice(index, 1);
      } else {
        toKeep.push(measure);
      }
    }

    this._source.measures = toKeep;

    return {
      notFound: assetMeasureNames,
      removed,
    };
  }
}
