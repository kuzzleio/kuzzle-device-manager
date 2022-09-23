import { JSONObject, PluginImplementationError } from "kuzzle";
import _ from "lodash";

import { measuresMappings } from "../../mappings";
import { MeasureDefinition } from "../../types";

export class MeasuresRegister {
  private mappings: JSONObject;

  /**
   * Registered measures
   *
   * Map<type, MeasureDefinition>
   */
  private measures = new Map<string, MeasureDefinition>();

  constructor() {
    this.mappings = JSON.parse(JSON.stringify(measuresMappings));
  }

  /**
   * Register custom measure definition
   *
   * ```js
   * plugin.measure.register('humidity', {
   *   unit: {
   *     name: 'Humidity',
   *     sign: '%',
   *     type: 'number',
   *   },
   *   valuesMappings: { humidity: { type: 'float' } },
   * });
   * ```
   */
  register(type: string, measure: MeasureDefinition) {
    if (this.measures.has(type)) {
      throw new PluginImplementationError(`Measure "${type}" already exists.`);
    }

    for (const [field, definition] of Object.entries(measure.valuesMappings)) {
      if (
        this.mappings.properties.values.properties[field] &&
        !_.isEqual(
          this.mappings.properties.values.properties[field],
          definition
        )
      ) {
        throw new PluginImplementationError(
          `Measure "${type}" register a different type for value "${field}".`
        );
      }

      this.mappings.properties.values.properties[field] = definition;
    }

    this.measures.set(type, measure);
  }

  get(type: string): MeasureDefinition {
    if (!this.measures.has(type)) {
      throw new PluginImplementationError(`Measure "${type}" does not exists.`);
    }

    return this.measures.get(type);
  }

  has(type: string): boolean {
    return this.measures.has(type);
  }

  getMappings(): JSONObject {
    return this.mappings;
  }
}
