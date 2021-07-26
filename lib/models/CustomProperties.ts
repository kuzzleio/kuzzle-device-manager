import { JSONObject } from 'kuzzle';

export class CustomProperties {
  /**
   * Collection mappings for each tenant group
   */
   public definitions: Map<string, JSONObject>;

   constructor (defaultMappings: JSONObject) {
     this.definitions = new Map<string, JSONObject>();

     // Initialize commons properties from default mappings
     this.definitions.set('commons', defaultMappings.properties);
   }

   mergeMappings (propertyName: string, mappings: JSONObject, group: string) {
    const property = this.definitions.has(group)
      ? this.definitions.get(group)[propertyName] || {}
      : {};

    property.properties = { ...property.properties, ...mappings }

    this.definitions.set(group, { ...this.definitions.get(group), [propertyName]: property });
   }
}

export class AssetsCustomProperties extends CustomProperties {
  /**
   * Define custom mappings for the "metadata" property
   *
   * @param mappings Mappings definition of the "metadata" property
   * @param options Additional options
   *    - `group` Name of the group for which the mappings should apply
   */
  registerMetadata (mappings: JSONObject, { group='commons' }: { group?: string } = {}) {
    this.mergeMappings('metadata', mappings, group);
  }
}

export class DevicesCustomProperties extends CustomProperties {
  /**
   * Define custom mappings for the "qos" property
   *
   * @param mappings Mappings definition of the "qos" property
   * @param options Additional options
   *    - `group` Name of the group for which the mappings should apply
   */
  registerQos (mappings: JSONObject, { group='commons' }: { group?: string } = {}) {
    this.mergeMappings('qos', mappings, group);
  }

  /**
   * Define custom mappings for the "metadata" property
   *
   * @param mappings Mappings definition of the "metadata" property
   * @param options Additional options
   *    - `group` Name of the group for which the mappings should apply
   */
  registerMetadata (mappings: JSONObject, { group='commons' }: { group?: string } = {}) {
    this.mergeMappings('metadata', mappings, group);
  }

  /**
   * Define custom mappings for the "measures" property
   *
   * @param measureName Name of the measure property you mean to add (eg. 'temperature')
   * @param mappings Mappings definition of the added measure property
   * @param options Additional options
   *    - `group` Name of the group for which the mappings should apply
   */
  registerMeasure (measureName: string, mappings: JSONObject, { group='commons' }: { group?: string } = {}) {
    this.mergeMappings('measures', { [measureName]: { ...mappings } }, group);
  }
}
