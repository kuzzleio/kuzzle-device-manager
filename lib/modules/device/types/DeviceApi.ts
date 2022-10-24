import { JSONObject, KDocument, KHit, SearchResult } from "kuzzle";

import { DeviceLink, AssetContent } from "../../asset";
import { Metadata } from "../../shared";

import { DeviceContent } from "./DeviceContent";

interface DeviceControllerRequest {
  controller: "device-manager/devices";

  engineId: string;
}

export interface ApiDeviceGetRequest extends DeviceControllerRequest {
  action: "get";

  _id: string;
}
export type ApiDeviceGetResult = KDocument<DeviceContent>;

export interface ApiDeviceUpdateRequest extends DeviceControllerRequest {
  action: "update";

  _id: string;

  refresh?: string;

  body: {
    metadata: Metadata;
  };
}
export type ApiDeviceUpdateResult = KDocument<DeviceContent>;

export interface ApiDeviceCreateRequest extends DeviceControllerRequest {
  action: "create";

  refresh?: string;

  body: {
    model: string;

    reference: string;

    metadata?: Metadata;

    assetId?: string;

    measureNamesLinks?: DeviceLink["measureNamesLinks"];
  };
}
export type ApiDeviceCreateResult = KDocument<DeviceContent>;

export interface ApiDeviceDeleteRequest extends DeviceControllerRequest {
  action: "delete";

  _id: string;

  refresh?: string;

  strict?: boolean;
}
export type ApiDeviceDeleteResult = void;

export interface ApiDeviceSearchRequest extends DeviceControllerRequest {
  action: "search";

  from?: number;

  size?: number;

  scrollTTL?: string;

  body: JSONObject;
}
export type ApiDeviceSearchResult = SearchResult<KHit<DeviceContent>>;

export interface ApiDeviceUnlinkAssetRequest extends DeviceControllerRequest {
  action: "unlinkAsset";

  _id: string;

  strict?: boolean;

  refresh?: string;
}
export type ApiDeviceUnlinkAssetResult = {
  asset: KDocument<AssetContent>;
  device: KDocument<DeviceContent>;
};

export interface ApiDeviceAttachEngineRequest extends DeviceControllerRequest {
  action: "attachEngine";

  _id: string;

  refresh?: string;
}
export type ApiDeviceAttachEngineResult = void;

export interface ApiDeviceDetachEngineRequest extends DeviceControllerRequest {
  action: "detachEngine";

  _id: string;

  refresh?: string;
}
export type ApiDeviceDetachEngineResult = void;

export interface ApiDeviceLinkAssetRequest extends DeviceControllerRequest {
  action: "linkAsset";

  _id: string;

  refresh?: string;

  assetId: string;

  body?: {
    measureNamesLinks?: DeviceLink["measureNamesLinks"];
  };
}
export type ApiDeviceLinkAssetResult = {
  asset: KDocument<AssetContent>;
  device: KDocument<DeviceContent>;
};
