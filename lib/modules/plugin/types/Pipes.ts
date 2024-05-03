import { JSONObject, KDocumentContent, KHit, KuzzleRequest } from "kuzzle";

export interface SearchQueryResult<T extends KDocumentContent> {
  aggregations?: JSONObject;
  hits: Array<KHit<T>>;
  remaining: unknown;
  scrollId: string;
  suggest: JSONObject;
  total: number;
}

export type EventGenericDocumentBeforeSearch = {
  name: `generic:document:beforeSearch`;
  args: [JSONObject, KuzzleRequest];
};

export type EventGenericDocumentAfterSearch<
  T extends KDocumentContent = KDocumentContent,
> = {
  name: `generic:document:afterSearch`;
  args: [SearchQueryResult<T>, KuzzleRequest];
};
