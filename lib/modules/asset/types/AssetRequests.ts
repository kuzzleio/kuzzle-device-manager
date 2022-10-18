import { JSONObject, KDocument, KHit, SearchResult } from "kuzzle";

import { AssetContent, Metadata } from "./AssetContent";

export interface AssetControllerRequest {
  controller: 'device-manager/assets';

  engineId: string;
}

export interface AssetGetRequest extends AssetControllerRequest {
  action: 'get';

  _id: string;
}
export type AssetGetResult = KDocument<AssetContent>;

export interface AssetUpdateRequest extends AssetControllerRequest {
  action: 'update';

  _id: string;

  refresh?: string;

  body: {
    metadata: Metadata;
  }
}
export type AssetUpdateResult = KDocument<AssetContent>;

export interface AssetCreateRequest extends AssetControllerRequest {
  action: 'create';

  refresh?: string;

  body: {
    model: string;

    reference: string;

    metadata?: Metadata;
  }
}
export type AssetCreateResult = KDocument<AssetContent>;

export interface AssetDeleteRequest extends AssetControllerRequest {
  action: 'delete';

  _id: string;

  refresh?: string;

  strict?: boolean;
}
export type AssetDeleteResult = void;

export interface AssetSearchRequest extends AssetControllerRequest {
  action: 'search';

  from?: number;

  size?: number;

  scrollTTL?: string;

  body: JSONObject;
}
export type AssetSearchResult = SearchResult<KHit<AssetContent>>;
