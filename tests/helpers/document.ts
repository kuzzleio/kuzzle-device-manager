import { Kuzzle } from "kuzzle-sdk";

/**
 * Returns directly the document content
 */
export async function documentGet(
  sdk: Kuzzle,
  index: string,
  collection: string,
  id: string
) {
  return (await sdk.document.get(index, collection, id))._source;
}
