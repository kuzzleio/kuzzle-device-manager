import { JSONObject, KuzzleError } from "kuzzle";

export class MappingsConflictsError extends KuzzleError {
  private conflicts: JSONObject;
  constructor(
    message: string,
    conflicts: JSONObject,
    id?: string,
    code?: number,
  ) {
    super(message, 409, id, code);
    this.conflicts = conflicts;
  }

  get name() {
    return "MappingsConflictsError";
  }

  public toJSON() {
    const json = super.toJSON();

    json.chunks = this.conflicts;

    return json;
  }
}
