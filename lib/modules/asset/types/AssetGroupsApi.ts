import {
  JSONObject,
  KDocument,
  KHit,
  SearchResult,
  mUpdateResponse,
} from "kuzzle-sdk";
import { AssetsGroupsBody, AssetsGroupContent } from "./AssetGroupContent";

// Remove "lastUpdate" property for request
type AssetsGroupsRequest = Omit<AssetsGroupsBody, "lastUpdate">;
export type AssetsGroupsBodyRequest = Partial<AssetsGroupsRequest> &
  Omit<AssetsGroupsRequest, "type">;

export type UpdateAssetLinkResponse = mUpdateResponse & {
  assetsGroups: KDocument<AssetsGroupContent>;
};

interface GroupControllerRequest {
  controller: "device-manager/assetsGroup";
  engineId: string;
}

export interface ApiGroupCreateRequest extends GroupControllerRequest {
  action: "create";
  _id?: string;
  body: AssetsGroupsBodyRequest & { path?: string };
}

export type ApiGroupCreateResult = KDocument<AssetsGroupContent>;

export interface ApiGroupGetRequest extends GroupControllerRequest {
  action: "get";
  _id: string;
}

export type ApiGroupGetResult = KDocument<AssetsGroupContent>;

export interface ApiGroupUpdateRequest extends GroupControllerRequest {
  action: "update";
  _id: string;
  body: AssetsGroupsBodyRequest;
}

export type ApiGroupUpdateResult = KDocument<AssetsGroupContent>;

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
export type ApiGroupSearchResult = SearchResult<KHit<AssetsGroupContent>>;

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
