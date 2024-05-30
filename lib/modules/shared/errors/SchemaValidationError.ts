import { JSONObject, KuzzleError } from "kuzzle";

export class SchemaValidationError extends KuzzleError {
  private errors: JSONObject;
  constructor(message: string, errors: JSONObject, id?: string, code?: number) {
    super(message, 400, id, code);
    this.errors = errors;
  }

  get name() {
    return "SchemaValidationError";
  }

  public toJSON() {
    const json = super.toJSON();

    json.errors = this.errors;

    return json;
  }
}
