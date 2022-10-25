import { JSONObject, KDocument, KHit, SearchResult } from "kuzzle";

import { DeviceLink, AssetContent } from "../../asset";
import { Metadata } from "../../shared";

import { DeviceContent } from "./DeviceContent";

interface DevicesControllerRequest {
  controller: "device-manager/devices";

  engineId: string;
}

export interface ApiDeviceGetRequest extends DevicesControllerRequest {
  action: "get";

  _id: string;
}
export type ApiDeviceGetResult = KDocument<DeviceContent>;

export interface ApiDeviceUpdateRequest extends DevicesControllerRequest {
  action: "update";

  _id: string;

  refresh?: string;

  body: {
    metadata: Metadata;
  };
}
export type ApiDeviceUpdateResult = KDocument<DeviceContent>;

export interface ApiDeviceCreateRequest extends DevicesControllerRequest {
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

export interface ApiDeviceDeleteRequest extends DevicesControllerRequest {
  action: "delete";

  _id: string;

  refresh?: string;

  strict?: boolean;
}
export type ApiDeviceDeleteResult = void;

export interface ApiDeviceSearchRequest extends DevicesControllerRequest {
  action: "search";

  from?: number;

  size?: number;

  scrollTTL?: string;

  body: JSONObject;
}
export type ApiDeviceSearchResult = SearchResult<KHit<DeviceContent>>;

export interface ApiDeviceUnlinkAssetRequest extends DevicesControllerRequest {
  action: "unlinkAsset";

  _id: string;

  strict?: boolean;

  refresh?: string;
}
export type ApiDeviceUnlinkAssetResult = {
  asset: KDocument<AssetContent>;
  device: KDocument<DeviceContent>;
};

export interface ApiDeviceAttachEngineRequest extends DevicesControllerRequest {
  action: "attachEngine";

  _id: string;

  refresh?: string;
}
export type ApiDeviceAttachEngineResult = void;

export interface ApiDeviceDetachEngineRequest extends DevicesControllerRequest {
  action: "detachEngine";

  _id: string;

  refresh?: string;
}
export type ApiDeviceDetachEngineResult = void;

export interface ApiDeviceLinkAssetRequest extends DevicesControllerRequest {
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
