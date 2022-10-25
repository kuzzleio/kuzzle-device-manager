import { JSONObject } from "kuzzle";

import { MeasuresController } from "../MeasuresController";
import { AssetMeasurement } from "./MeasureContent";

interface MeasuresControllerRequest {
  controller: "device-manager/measures";

  engineId: string;
}

export interface ApiMeasurePushRequest extends MeasuresControllerRequest {
  action: "push";

  refresh?: string;

  body: {
    assetId: string;

    measure: AssetMeasurement<JSONObject>;
  };
}
export type ApiMeasurePushResult = ReturnType<MeasuresController["push"]>;
