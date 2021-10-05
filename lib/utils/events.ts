import { KuzzleRequest, JSONObject } from 'kuzzle';

/**
 * Returns a KuzzleRequest containing the payload in the result property.
 * 
 * This is used to trigger event with payload that can be used by the workflow
 * plugin.
 */
export function eventPayload (payload: JSONObject): KuzzleRequest {
  return new KuzzleRequest({}, {
    result: payload
  });
}
