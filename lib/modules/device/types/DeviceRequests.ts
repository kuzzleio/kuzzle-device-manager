import { JSONObject, KDocument, KHit, SearchResult } from "kuzzle";

import { Metadata } from "../../asset";
import { DeviceContent } from "./DeviceContent";

export interface DeviceControllerRequest {
  controller: 'device-manager/devices';

  engineId: string;
}

export interface DeviceGetRequest extends DeviceControllerRequest {
  action: 'get';

  _id: string;
}
export type DeviceGetResult = KDocument<DeviceContent>;

export interface DeviceUpdateRequest extends DeviceControllerRequest {
  action: 'update';

  _id: string;

  refresh?: string;

  body: {
    metadata: Metadata;
  }
}
export type DeviceUpdateResult = KDocument<DeviceContent>;

export interface DeviceCreateRequest extends DeviceControllerRequest {
  action: 'create';

  refresh?: string;

  body: {
    model: string;

    reference: string;

    metadata?: Metadata;
  }
}
export type DeviceCreateResult = KDocument<DeviceContent>;

export interface DeviceDeleteRequest extends DeviceControllerRequest {
  action: 'delete';

  _id: string;

  refresh?: string;

  strict?: boolean;
}
export type DeviceDeleteResult = void;

export interface DeviceSearchRequest extends DeviceControllerRequest {
  action: 'search';

  from?: number;

  size?: number;

  scrollTTL?: string;

  body: JSONObject;
}
export type DeviceSearchResult = SearchResult<KHit<DeviceContent>>;


export interface DeviceUnlinkAssetRequest extends DeviceControllerRequest {
  action: 'update';

  _id: string;

  strict?: boolean;

  refresh?: string;
}
export type DeviceUnlinkAssetResult = {
  Device: KDocument<DeviceContent>;
  device: KDocument<DeviceContent>;
};
