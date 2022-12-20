/**
 * Convert a string to snake_case
 *
 * @todo use Inflector.snakeCase when
 * https://github.com/kuzzleio/kuzzle/pull/2415 is released
 */
export function snakeCase(str: string) {
  return str.replace(/\W+/g, " ")
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_');
};