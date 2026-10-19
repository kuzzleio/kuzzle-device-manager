import { JSONObject } from "kuzzle-sdk";

/**
 * Group paths are the ids of the ancestors joined by ".", so a plain string
 * prefix would also match siblings sharing the same id start
 * (e.g. "parent.quai-1" is a string prefix of "parent.quai-10").
 * Subtree checks must always include the separator.
 */
export const GROUP_PATH_SEPARATOR = ".";

/**
 * Whether `path` is the group `groupPath` itself or one of its descendants
 */
export function isInSubtree(path: string, groupPath: string): boolean {
  return (
    path === groupPath || path.startsWith(groupPath + GROUP_PATH_SEPARATOR)
  );
}

/**
 * Replaces the leading `oldPath` of a path of its subtree by `newPath`
 */
export function rebasePath(
  path: string,
  oldPath: string,
  newPath: string,
): string {
  return path === oldPath ? newPath : newPath + path.slice(oldPath.length);
}

/**
 * Elasticsearch query matching the documents whose `field` (a keyword) is in
 * the subtree of `groupPath`
 */
export function subtreeQuery(
  field: string,
  groupPath: string,
  { includeSelf = true }: { includeSelf?: boolean } = {},
): JSONObject {
  const descendants = {
    prefix: { [field]: groupPath + GROUP_PATH_SEPARATOR },
  };

  if (!includeSelf) {
    return descendants;
  }

  // ? Filter only: scoring would rank the items of the group itself before those of its descendants
  return {
    constant_score: {
      filter: {
        bool: {
          minimum_should_match: 1,
          should: [{ term: { [field]: groupPath } }, descendants],
        },
      },
    },
  };
}
