import { KuzzleError } from "kuzzle";

export class MeasuresDuplicatesError extends KuzzleError {
  private duplicates: string[];
  constructor(
    message: string,
    duplicates: string[],
    id?: string,
    code?: number,
  ) {
    super(message, 400, id, code);
    this.duplicates = duplicates;
  }

  get name() {
    return "MeasuresDuplicatesError";
  }

  public toJSON() {
    const json = super.toJSON();

    json.duplicates = this.duplicates;

    return json;
  }
}
