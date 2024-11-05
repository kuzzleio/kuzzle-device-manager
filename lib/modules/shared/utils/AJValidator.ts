import addFormats from "ajv-formats";
import Ajv, { SchemaObject } from "ajv";

/**
 * TODO: add stricter TypeScript rules to allow the use of JSONSchemaType
 */
const ajv = addFormats(new Ajv({}), [
  "date-time",
  "time",
  "date",
  "email",
  "hostname",
  "ipv4",
  "ipv6",
  "uri",
  "uri-reference",
  "uuid",
  "uri-template",
  "json-pointer",
  "relative-json-pointer",
  "regex",
]);

/**
 * Compile and add the schema to the AJV cache
 *
 * @param scemaID The schema unique identifier
 * @param schema The schema to add
 *
 * @returns The newly created validator for the schema
 * @throws If the provided schema is not valid
 */
export function addSchemaToCache(schemaID: string, schema: SchemaObject) {
  ajv.removeSchema(schemaID);
  return ajv.addSchema(schema, schemaID);
}

/**
 * Search the corresponding validator in the AJV cache.
 *
 * @param schemaID The desired schema identifier
 *
 * @returns The desired schema validator
 * @throws If the schema cannot be found
 */
export function getValidator(schemaID: string) {
  return ajv.getSchema(schemaID);
}

/**
 * Get and return the previous AJV errors
 *
 * @returns an array of ErrorObject
 */
export function getAJVErrors() {
  return ajv.errors ?? [];
}
