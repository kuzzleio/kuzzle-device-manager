import { JSONObject } from 'kuzzle';

export class CustomProperties {
  /**
   * Collection mappings for each tenant group
   */
   public definitions: Map<string, JSONObject>;

   constructor (defaultMappings: JSONObject) {
     this.definitions = new Map<string, JSONObject>();

     // Initialize shared properties from default mappings
     this.definitions.set('shared', defaultMappings.properties);
   }

   mergeMappings (propertyName: string, mappings: JSONObject, tenantGroup: string) {
    const property = this.definitions.has(tenantGroup)
      ? this.definitions.get(tenantGroup)[propertyName] || {}
      : {};

    property.properties = { ...property.properties, ...mappings }

    this.definitions.set(tenantGroup, { ...this.definitions.get(tenantGroup), property });
   }
}

export class AssetsCustomProperties extends CustomProperties {
  /**
   * Define custom mappings for the "metadata" property
   *
   * @param mappings Mappings definition of the "metadata" property
   * @param options Additional options
   *    - `tenantGroup` Name of the group for which the mappings should apply
   */
  registerMetadata (mappings: JSONObject, { tenantGroup='shared' }: { tenantGroup?: string } = {}) {
    this.mergeMappings('metadata', mappings, tenantGroup);
  }
}

export class DevicesCustomProperties extends CustomProperties {
  /**
   * Define custom mappings for the "qos" property
   *
   * @param mappings Mappings definition of the "qos" property
   * @param options Additional options
   *    - `tenantGroup` Name of the group for which the mappings should apply
   */
  registerQos (mappings: JSONObject, { tenantGroup='shared' }: { tenantGroup?: string } = {}) {
    this.mergeMappings('qos', mappings, tenantGroup);
  }

  /**
   * Define custom mappings for the "metadata" property
   *
   * @param mappings Mappings definition of the "metadata" property
   * @param options Additional options
   *    - `tenantGroup` Name of the group for which the mappings should apply
   */
  registerMetadata (mappings: JSONObject, { tenantGroup='shared' }: { tenantGroup?: string } = {}) {
    this.mergeMappings('metadata', mappings, tenantGroup);
  }

  /**
   * Define custom mappings for the "measures" property
   *
   * @param measureName Name of the measure property you mean to add (eg. 'temperature')
   * @param mappings Mappings definition of the added measure property
   * @param options Additional options
   *    - `tenantGroup` Name of the group for which the mappings should apply
   */
  registerMeasure (measureName: string, mappings: JSONObject, { tenantGroup='shared' }: { tenantGroup?: string } = {}) {
    this.mergeMappings('measures', { [measureName]: { ...mappings } }, tenantGroup);
  }
}
