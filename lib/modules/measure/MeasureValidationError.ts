import { ErrorObject } from "ajv";
import { KuzzleError } from "kuzzle";

export interface MeasureValidationChunks {
  measureName: string;
  validationErrors: ErrorObject[];
}

export class MeasureValidationError extends KuzzleError {
  private errors: MeasureValidationChunks[];
  constructor(
    message: string,
    errors: MeasureValidationChunks[],
    id?: string,
    code?: number,
  ) {
    super(message, 400, id, code);
    this.errors = errors;
  }

  get name() {
    return "MeasureValidationError";
  }

  public toJSON() {
    const json = super.toJSON();

    json.errors = this.errors;

    return json;
  }
}
