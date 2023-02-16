import { KuzzleError } from "kuzzle";

export function keepStack(original: Error, error: KuzzleError) {
  error.stack = original.stack;

  return error;
}
