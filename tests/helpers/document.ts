import { JSONObject, Kuzzle } from "kuzzle-sdk";

/**
 * Returns directly the document content
 */
export async function documentGet<TContent = JSONObject>(
  sdk: Kuzzle,
  index: string,
  collection: string,
  id: string
) {
  return (await sdk.document.get<TContent>(index, collection, id))._source;
}
