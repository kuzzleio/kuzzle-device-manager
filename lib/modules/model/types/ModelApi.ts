import { JSONObject, KDocument } from "kuzzle-sdk";

import {
  AssetModelContent,
  DeviceModelContent,
  MeasureModelContent,
} from "./ModelContent";

interface ModelsControllerRequest {
  controller: "device-manager/models";
}

export interface ApiModelGetAssetRequest extends ModelsControllerRequest {
  action: "getAsset";
  model: string;
  engineGroup: string;
}
export type ApiModelGetAssetResult = KDocument<AssetModelContent>;

export interface ApiModelGetDeviceRequest extends ModelsControllerRequest {
  action: "getDevice";
  model: string;
}
export type ApiModelGetDeviceResult = KDocument<DeviceModelContent>;

export interface ApiModelGetMeasureRequest extends ModelsControllerRequest {
  action: "getMeasure";
  type: string;
}
export type ApiModelGetMeasureResult = KDocument<MeasureModelContent>;

export interface ApiModelWriteAssetRequest extends ModelsControllerRequest {
  action: "writeAsset";

  body: {
    engineGroup: string;
    model: string;
    metadataMappings?: JSONObject;
    defaultValues?: JSONObject;
    measures?: AssetModelContent["asset"]["measures"];
  };
}
export type ApiModelWriteAssetResult = KDocument<AssetModelContent>;

export interface ApiModelWriteDeviceRequest extends ModelsControllerRequest {
  action: "writeDevice";

  body: {
    model: string;
    metadataMappings?: JSONObject;
    defaultValues?: JSONObject;
    measures: DeviceModelContent["device"]["measures"];
  };
}
export type ApiModelWriteDeviceResult = KDocument<DeviceModelContent>;

export interface ApiModelWriteMeasureRequest extends ModelsControllerRequest {
  action: "writeMeasure";

  body: {
    type: string;
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
