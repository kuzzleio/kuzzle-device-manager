import { SchemaObject } from "ajv";
import { JSONObject } from "kuzzle-sdk";

/**
 * Represents a measure definition registered by the Device Manager
 *
 * @example
 * {
 *   valuesMappings: { temperature: { type: 'float' } },
 *   validationSchema: {
        type: "object",
        properties: {
            temperature: { 
              type: "number",
              multipleOf: 0.01
            }
        },
        required: ["temperature"],
        additionalProperties: false
    }
 * }
 */
export interface MeasureDefinition {
  /**
   * Mappings for the measurement values in order to index the fields
   */
  valuesMappings: JSONObject;
  /**
   * Schema to validate the values against
   */
  validationSchema?: SchemaObject;
}
