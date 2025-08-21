import {
  JSONObject,
  KDocument,
  KHit,
  SearchResult,
  mCreateResponse,
  mUpdateResponse,
} from "kuzzle-sdk";
import { GroupsBody, GroupContent } from "./GroupContent";
import { DeviceContent } from "lib/modules/device";
import { AssetContent } from "lib/modules/asset";

// Remove "lastUpdate" property for request
type GroupsRequest = Omit<GroupsBody, "lastUpdate">;
export type GroupsBodyRequest = Partial<GroupsRequest>;

export type UpdateLinkResponse = mUpdateResponse & {
  group: KDocument<GroupContent>;
};

interface GroupControllerRequest {
  controller: "device-manager/groups";
  engineId: string;
}

export interface ApiGroupCreateRequest extends GroupControllerRequest {
  action: "create";
  _id?: string;
  body: GroupsBodyRequest;
}

export type ApiGroupCreateResult = KDocument<GroupContent>;

export interface ApiGroupGetRequest extends GroupControllerRequest {
  action: "get";
  _id: string;
}

export type ApiGroupGetResult = KDocument<GroupContent>;

export interface ApiGroupUpdateRequest extends GroupControllerRequest {
  action: "update";
  _id: string;
  body: GroupsBodyRequest;
}

export type ApiGroupUpdateResult = KDocument<GroupContent>;

export interface ApiGroupUpsertRequest extends GroupControllerRequest {
  action: "upsert";
  _id?: string;
  body: GroupsBodyRequest;
}

export type ApiGroupUpsertResult = KDocument<GroupContent>;
export interface ApiGroupDeleteRequest extends GroupControllerRequest {
  action: "delete";
  _id: string;
}

export type ApiGroupDeleteResult = void;

export interface ApiGroupSearchRequest extends GroupControllerRequest {
  action: "search";
  from?: number;
  size?: number;
  scrollTTL?: string;
  lang?: "koncorde" | "elasticsearch";
  body: JSONObject;
}
export type ApiGroupSearchResult = SearchResult<KHit<GroupContent>>;

export interface ApiGroupListItemsRequest extends GroupControllerRequest {
  action: "listItems";
  from?: number;
  size?: number;
  body: { includeChildren?: boolean };
  _id: string;
}
export type ApiGroupListItemsResult = {
  assets: { hits: Array<KHit<AssetContent>>; total: number };
  devices: { hits: Array<KHit<DeviceContent>>; total: number };
};

export interface ApiGroupAddAssetsRequest extends GroupControllerRequest {
  action: "addAsset";
  body: {
    path: string;
    assetIds: string[];
  };
}
export type ApiGroupAddAssetsResult = UpdateLinkResponse;

export interface ApiGroupRemoveAssetsRequest extends GroupControllerRequest {
  action: "removeAsset";
  body: {
    path: string;
    assetIds: string[];
  };
}
export type ApiGroupRemoveAssetsResult = UpdateLinkResponse;
export interface ApiGroupAddDeviceRequest extends GroupControllerRequest {
  action: "addDevice";
  body: {
    path: string;
    deviceIds: string[];
  };
}
export type ApiGroupAddDevicesResult = UpdateLinkResponse;

export interface ApiGroupRemoveDeviceRequest extends GroupControllerRequest {
  action: "removeDevice";
  body: {
    path: string;
    deviceIds: string[];
  };
}
export type ApiGroupRemoveDeviceResult = UpdateLinkResponse;

export interface ApiGroupMCreateRequest extends GroupControllerRequest {
  action: "mCreate";
  body: {
    groups: Array<GroupsBodyRequest & { _id?: string }>;
  };
}
export type ApiGroupMCreateResult = mCreateResponse & {
  successes: Array<{
    _id: string;
    _source: GroupContent;
    created: boolean;
  }>;
};

export interface ApiGroupMUpdateRequest extends GroupControllerRequest {
  action: "mUpdate";
  body: {
    groups: Array<GroupsBody & { _id: string }>;
  };
}
export type ApiGroupMUpdateResult = {
  errors: mUpdateResponse["errors"];
  successes: KDocument<GroupContent>[];
};

export interface ApiGroupMUpsertRequest extends GroupControllerRequest {
  action: "mUpsert";
  body: {
    groups: Array<GroupsBody & { _id?: string }>;
  };
}
export type ApiGroupMUpsertResult = {
  errors: Array<
    ApiGroupMCreateResult["errors"][0] | ApiGroupMUpdateResult["errors"][0]
  >;
  successes: Array<
    | ApiGroupMCreateResult["successes"][0]
    | ApiGroupMUpdateResult["successes"][0]
  >;
};
