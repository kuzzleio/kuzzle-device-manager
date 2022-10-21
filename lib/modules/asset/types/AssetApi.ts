import { JSONObject } from "kuzzle";

import { AssetMeasurement } from "../../../modules/measure";
import { Metadata } from "../../shared";
import { AssetController } from "../AssetController";

interface AssetControllerRequest {
  controller: "device-manager/assets";

  engineId: string;
}

export interface ApiAssetGetRequest extends AssetControllerRequest {
  action: "get";

  _id: string;
}
export type ApiAssetGetResult = ReturnType<AssetController["get"]>;

export interface ApiAssetUpdateRequest extends AssetControllerRequest {
  action: "update";

  _id: string;

  refresh?: string;

  body: {
    metadata: Metadata;
  };
}
export type ApiAssetUpdateResult = ReturnType<AssetController["update"]>;

export interface ApiAssetCreateRequest extends AssetControllerRequest {
  action: "create";

  refresh?: string;

  body: {
    model: string;

    reference: string;

    metadata?: Metadata;
  };
}
export type ApiAssetCreateResult = ReturnType<AssetController["create"]>;

export interface ApiAssetDeleteRequest extends AssetControllerRequest {
  action: "delete";

  _id: string;

  refresh?: string;

  strict?: boolean;
}
export type ApiAssetDeleteResult = ReturnType<AssetController["delete"]>;

export interface ApiAssetSearchRequest extends AssetControllerRequest {
  action: "search";

  from?: number;

  size?: number;

  scrollTTL?: string;

  body: JSONObject;
}
export type ApiAssetSearchResult = ReturnType<AssetController["search"]>;

export interface ApiAssetGetMeasuresRequest extends AssetControllerRequest {
  action: "getMeasures";

  _id: string;

  size?: number;

  startAt?: string;

  endAt?: string;
}
export type ApiAssetGetMeasuresResult = ReturnType<
  AssetController["getMeasures"]
>;
