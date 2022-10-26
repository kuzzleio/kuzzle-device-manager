import { JSONObject, KDocument, KHit, SearchResult } from "kuzzle";

import { MeasureContent } from "../../../modules/measure";
import { Metadata } from "../../shared";

import { AssetContent } from "./AssetContent";

interface AssetsControllerRequest {
  controller: "device-manager/assets";

  engineId: string;
}

export interface ApiAssetGetRequest extends AssetsControllerRequest {
  action: "get";

  _id: string;
}
export type ApiAssetGetResult = KDocument<AssetContent>;

export interface ApiAssetUpdateRequest extends AssetsControllerRequest {
  action: "update";

  _id: string;

  refresh?: string;

  body: {
    metadata: Metadata;
  };
}
export type ApiAssetUpdateResult = KDocument<AssetContent>;

export interface ApiAssetCreateRequest extends AssetsControllerRequest {
  action: "create";

  refresh?: string;

  body: {
    model: string;

    reference: string;

    metadata?: Metadata;
  };
}
export type ApiAssetCreateResult = KDocument<AssetContent>;

export interface ApiAssetDeleteRequest extends AssetsControllerRequest {
  action: "delete";

  _id: string;

  refresh?: string;

  strict?: boolean;
}
export type ApiAssetDeleteResult = void;

export interface ApiAssetSearchRequest extends AssetsControllerRequest {
  action: "search";

  from?: number;

  size?: number;

  scrollTTL?: string;

  body: JSONObject;
}
export type ApiAssetSearchResult = SearchResult<KHit<AssetContent>>;

export interface ApiAssetGetMeasuresRequest extends AssetsControllerRequest {
  action: "getMeasures";

  _id: string;

  size?: number;

  startAt?: string;

  endAt?: string;
}
export type ApiAssetGetMeasuresResult = {
  measures: Array<KDocument<MeasureContent<JSONObject>>>;
};