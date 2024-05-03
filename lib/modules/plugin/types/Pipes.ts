import {
  JSONObject,
  KDocument,
  KDocumentContent,
  KHit,
  KuzzleRequest,
} from "kuzzle";

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

export type EventGenericDocumentBeforeWrite = {
  name: `generic:document:beforeWrite`;
  args: [KDocument<KDocumentContent>[], KuzzleRequest];
};

export type EventGenericDocumentBeforeUpdate = {
  name: `generic:document:beforeUpdate`;
  args: [KDocument<KDocumentContent>[], KuzzleRequest];
};
