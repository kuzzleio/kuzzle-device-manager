import { JSONObject, KDocument } from "kuzzle";

import {
  AssetModelContent,
  DeviceModelContent,
  MeasureModelContent,
} from "./ModelContent";

interface ModelsControllerRequest {
  controller: "device-manager/models";
}

export interface ApiModelWriteAssetRequest extends ModelsControllerRequest {
  action: "writeAsset";

  body: {
    engineGroup: string;
    model: string;
    metadataMappings: JSONObject;
    defaultValues: JSONObject;
  };
}
export type ApiModelWriteAssetResult = KDocument<AssetModelContent>;

export interface ApiModelWriteDeviceRequest extends ModelsControllerRequest {
  action: "writeDevice";

  body: {
    model: string;
    metadataMappings: JSONObject;
    defaultValues: JSONObject;
    measures: Record<string, string>
  };
}
export type ApiModelWriteDeviceResult = KDocument<DeviceModelContent>;

export interface ApiModelWriteMeasureRequest extends ModelsControllerRequest {
  action: "writeMeasure";

  body: {
    type: string;
    unit: {
      name: string;
      sign: string;
      type: string;
    };
    valuesMappings: JSONObject;
  };
}
export type ApiModelWriteMeasureResult = KDocument<MeasureModelContent>;

export interface ApiModelDeleteAssetRequest extends ModelsControllerRequest {
  action: "deleteAsset";

  _id: string;
}
export type ApiModelDeleteAssetResult = void;

export interface ApiModelDeleteDeviceRequest extends ModelsControllerRequest {
  action: "deleteDevice";

  _id: string;
}
export type ApiModelDeleteDeviceResult = void;

export interface ApiModelDeleteMeasureRequest extends ModelsControllerRequest {
  action: "deleteMeasure";

  _id: string;
}
export type ApiModelDeleteMeasureResult = void;

export interface ApiModelListAssetsRequest extends ModelsControllerRequest {
  action: "listAssets";

  engineGroup: string;
}
export type ApiModelListAssetsResult = {
  models: KDocument<AssetModelContent>[];
  total: number;
};

export interface ApiModelListDevicesRequest extends ModelsControllerRequest {
  action: "listDevices";
}
export type ApiModelListDevicesResult = {
  models: KDocument<DeviceModelContent>[];
  total: number;
};

export interface ApiModelListMeasuresRequest extends ModelsControllerRequest {
  action: "listMeasures";
}
export type ApiModelListMeasuresResult = {
  models: KDocument<MeasureModelContent>[];
  total: number;
};
