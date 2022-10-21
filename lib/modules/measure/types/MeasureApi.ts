import { JSONObject } from "kuzzle";

import { MeasureController } from "../MeasureController";
import { AssetMeasurement } from "./MeasureContent";

interface MeasureControllerRequest {
  controller: 'device-manager/measures';

  engineId: string;
}

export interface ApiMeasurePushRequest extends MeasureControllerRequest {
  action: 'push';

  refresh?: string;

  body: {
    assetId: string;

    measure: AssetMeasurement<JSONObject>;
  };
}
export type ApiMeasurePushResult = ReturnType<MeasureController["push"]>;
