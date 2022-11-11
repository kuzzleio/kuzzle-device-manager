import { JSONObject, KDocument } from "kuzzle";
import { AssetContent } from "lib/modules/asset";

import { MeasuresController } from "../MeasuresController";

interface MeasuresControllerRequest {
  controller: "device-manager/measures";

  engineId: string;
}

export interface ApiMeasurePushRequest extends MeasuresControllerRequest {
  action: "push";

  refresh?: string;

  body: {
    assetId: string;

    measure: {
      measureName: string;
      type: string;
      measuredAt?: number;
      values: JSONObject;
    };
  };
}
export type ApiMeasurePushResult = {
  asset: KDocument<AssetContent>
};
