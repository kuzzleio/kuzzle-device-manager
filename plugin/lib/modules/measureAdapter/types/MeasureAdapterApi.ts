import { JSONObject, KDocument, KHit, SearchResult } from "kuzzle-sdk";

import { MeasureAdapterContent } from "./MeasureAdapterContent";

type MeasureAdapterBodyRequest = Partial<
  Pick<MeasureAdapterContent, "name" | "source" | "mapping">
>;

interface MeasureAdapterControllerRequest {
  controller: "device-manager/measureAdapters";
  engineId: string;
}

export interface ApiMeasureAdapterCreateRequest extends MeasureAdapterControllerRequest {
  action: "create";
  _id?: string;
  body: MeasureAdapterBodyRequest;
}
export type ApiMeasureAdapterCreateResult = KDocument<MeasureAdapterContent>;

export interface ApiMeasureAdapterGetRequest extends MeasureAdapterControllerRequest {
  action: "get";
  _id: string;
}
export type ApiMeasureAdapterGetResult = KDocument<MeasureAdapterContent>;

export interface ApiMeasureAdapterUpdateRequest extends MeasureAdapterControllerRequest {
  action: "update";
  _id: string;
  body: MeasureAdapterBodyRequest;
}
export type ApiMeasureAdapterUpdateResult = KDocument<MeasureAdapterContent>;

export interface ApiMeasureAdapterDeleteRequest extends MeasureAdapterControllerRequest {
  action: "delete";
  _id: string;
}
export type ApiMeasureAdapterDeleteResult = void;

export interface ApiMeasureAdapterSearchRequest extends MeasureAdapterControllerRequest {
  action: "search";
  from?: number;
  size?: number;
  scrollTTL?: string;
  lang?: "koncorde" | "elasticsearch";
  body: JSONObject;
}
export type ApiMeasureAdapterSearchResult = SearchResult<
  KHit<MeasureAdapterContent>
>;
