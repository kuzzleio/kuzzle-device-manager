import {
  JSONObject,
  KDocument,
  KHit,
  SearchResult,
  mUpdateResponse,
} from "kuzzle-sdk";
import { GroupsBody, GroupContent } from "./GroupContent";

// Remove "lastUpdate" property for request
type GroupsRequest = Omit<GroupsBody, "lastUpdate">;
export type GroupsBodyRequest = Partial<GroupsRequest>;

export type UpdateAssetLinkResponse = mUpdateResponse & {
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

export interface ApiGroupAddAssetsRequest extends GroupControllerRequest {
  action: "addAsset";
  body: {
    path: string;
    assetIds: string[];
  };
}
export type ApiGroupAddAssetsResult = UpdateAssetLinkResponse;

export interface ApiGroupRemoveAssetsRequest extends GroupControllerRequest {
  action: "removeAsset";
  body: {
    path: string;
    assetIds: string[];
  };
}
export type ApiGroupRemoveAssetsResult = UpdateAssetLinkResponse;
