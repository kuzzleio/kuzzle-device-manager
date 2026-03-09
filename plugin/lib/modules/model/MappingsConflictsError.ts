import { KuzzleError } from "kuzzle";
import { ConflictChunk } from "./ModelsConflicts";

export class MappingsConflictsError extends KuzzleError {
  private conflicts: ConflictChunk[];
  constructor(
    message: string,
    conflicts: ConflictChunk[],
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
