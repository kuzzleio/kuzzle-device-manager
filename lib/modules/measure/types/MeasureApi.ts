import { JSONObject, KDocument } from "kuzzle";

import { AssetContent } from "../../../modules/asset";

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
      name: string;
      type: string;
      measuredAt?: number;
      values: JSONObject;
    };
  };
}
export type ApiMeasurePushResult = {
  asset: KDocument<AssetContent>;
};
