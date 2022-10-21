import { JSONObject } from "kuzzle";

import { DeviceLink } from "../../asset/types/DeviceLink";
import { DeviceController } from "../DeviceController";
import { Metadata } from "../../shared";

interface DeviceControllerRequest {
  controller: 'device-manager/devices';

  engineId: string;
}

export interface ApiDeviceGetRequest extends DeviceControllerRequest {
  action: 'get';

  _id: string;
}
export type ApiDeviceGetResult = ReturnType<DeviceController["get"]>;

export interface ApiDeviceUpdateRequest extends DeviceControllerRequest {
  action: 'update';

  _id: string;

  refresh?: string;

  body: {
    metadata: Metadata;
  }
}
export type ApiDeviceUpdateResult = ReturnType<DeviceController["update"]>;

export interface ApiDeviceCreateRequest extends DeviceControllerRequest {
  action: 'create';

  refresh?: string;

  body: {
    model: string;

    reference: string;

    metadata?: Metadata;

    assetId?: string;

    measureNamesLinks?: DeviceLink["measureNamesLinks"];
  }
}
export type ApiDeviceCreateResult = ReturnType<DeviceController["create"]>;

export interface ApiDeviceDeleteRequest extends DeviceControllerRequest {
  action: 'delete';

  _id: string;

  refresh?: string;

  strict?: boolean;
}
export type ApiDeviceDeleteResult = ReturnType<DeviceController["delete"]>;;

export interface ApiDeviceSearchRequest extends DeviceControllerRequest {
  action: 'search';

  from?: number;

  size?: number;

  scrollTTL?: string;

  body: JSONObject;
}
export type ApiDeviceSearchResult = ReturnType<DeviceController["search"]>;;


export interface ApiDeviceUnlinkAssetRequest extends DeviceControllerRequest {
  action: 'unlinkAsset';

  _id: string;

  strict?: boolean;

  refresh?: string;
}
export type ApiDeviceUnlinkAssetResult = ReturnType<DeviceController["unlinkAsset"]>;

export interface ApiDeviceAttachEngineRequest extends DeviceControllerRequest {
  action: 'attachEngine';

  _id: string;

  refresh?: string;
}
export type ApiDeviceAttachEngineResult = ReturnType<DeviceController["attachEngine"]>;;

export interface ApiDeviceDetachEngineRequest extends DeviceControllerRequest {
  action: 'detachEngine';

  _id: string;

  refresh?: string;
}
export type ApiDeviceDetachEngineResult = ReturnType<DeviceController["detachEngine"]>;;

export interface ApiDeviceLinkAssetRequest extends DeviceControllerRequest {
  action: 'linkAsset';

  _id: string;

  refresh?: string;

  assetId: string;

  body?: {
    measureNamesLinks?: DeviceLink["measureNamesLinks"];
  }
}
export type ApiDeviceLinkAssetResult = ReturnType<DeviceController["linkAsset"]>;
