import { JSONObject, KDocument } from "kuzzle";

import {
  AssetModelContent,
  DeviceModelContent,
  MeasureModelContent,
} from "./ModelContent";

interface ModelsControllerRequest {
  controller: "device-manager/models";
}

export interface ApiModelCreateAssetRequest extends ModelsControllerRequest {
  action: "createAsset";

  engineGroup?: string;

  body: {
    model: string;
    metadataMappings: JSONObject;
  };
}
export type ApiModelCreateAssetResult = KDocument<AssetModelContent>;

export interface ApiModelCreateDeviceRequest extends ModelsControllerRequest {
  action: "createDevice";

  body: {
    model: string;
    metadataMappings: JSONObject;
  };
}
export type ApiModelCreateDeviceResult = KDocument<DeviceModelContent>;

export interface ApiModelCreateMeasureRequest extends ModelsControllerRequest {
  action: "createMeasure";

  body: {
    name: string;
    unit: {
      name: string;
      sign: string;
      type: string;
    };
    valuesMappings: JSONObject;
  };
}
export type ApiModelCreateMeasureResult = KDocument<MeasureModelContent>;
