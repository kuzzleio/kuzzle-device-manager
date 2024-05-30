import { BadRequestError, JSONObject } from "kuzzle";

export class SchemaValidationError extends BadRequestError {
  private errors: JSONObject;
  constructor(message: string, errors: JSONObject, id?: string, code?: number) {
    super(message, id, code);
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
