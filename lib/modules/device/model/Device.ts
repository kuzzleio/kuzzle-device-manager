import { JSONObject } from "kuzzle";
import _ from "lodash";

import { MeasureContent } from "../../measure";
import { LinkRequest } from "../../asset";

import { DeviceContent } from "../types/DeviceContent";
import { DeviceSerializer } from "./DeviceSerializer";

export class Device {
  public _id: string;
  public _source: DeviceContent;

  constructor(content: DeviceContent, _id?: string) {
    this._id = _id || DeviceSerializer.id(content.model, content.reference);

    this._source = {
      metadata: [],
      ...content,
    };

    if (!Array.isArray(this._source.measures)) {
      this._source.measures = [];
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
}
