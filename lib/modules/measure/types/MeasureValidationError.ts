import { ErrorObject } from "ajv";

export interface MeasureValidationError {
  measureName: string;
  validationErrors: ErrorObject[];
}
