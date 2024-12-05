import { ErrorObject } from "ajv";
import { KuzzleError } from "kuzzle";

export class SchemaValidationError extends KuzzleError {
  private schemaErrors: ErrorObject[];
  constructor(
    message: string,
    schemaErrors: ErrorObject[],
    id?: string,
    code?: number,
  ) {
    super(message, 400, id, code);
    this.schemaErrors = schemaErrors;
  }

  get name() {
    return "SchemaValidationError";
  }

  public toJSON() {
    const json = super.toJSON();

    json.schemaErrors = this.schemaErrors;

    return json;
  }
}
