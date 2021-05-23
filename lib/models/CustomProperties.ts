import { JSONObject } from 'kuzzle';

export class AssetsCustomProperties {

  /**
   * Custom mappings for "assets" collection
   */
  public definitions: Map<string, JSONObject>;

  constructor(assetsMappings: JSONObject) {
    this.definitions = new Map<string, JSONObject>();

    // Initialize shared assets properties from default mappings
    this.definitions.set('shared', assetsMappings.properties);
  }

  /**
   * Define custom mappings for the "metadata" property
   *
   * @param mappings Mappings definition of the "metadata" property
   * @param options Additional options
   *    - `tenantGroup` Name of the group for which the mappings should apply
   */
  registerMetadata (mappings: JSONObject, { tenantGroup='shared' }: { tenantGroup?: string } = {}) {
    const metadata = this.definitions.has(tenantGroup)
      ? this.definitions.get(tenantGroup).metadata || {}
      : {};

    metadata.properties = { ...metadata.properties, ...mappings }

    this.definitions.set(tenantGroup, { ...this.definitions.get(tenantGroup), metadata });
  }
}

export class DevicesCustomProperties {
  /**
   * Custom mappings for "devices" collection
   */
  public definitions: Map<string, JSONObject>;

  constructor (deviceMappings: JSONObject) {
    this.definitions = new Map<string, JSONObject>();

    // Initialize shared devices properties from default mappings
    this.definitions.set('shared', deviceMappings.properties);
  }

  /**
   * Define custom mappings for the "qos" property
   *
   * @param mappings Mappings definition of the "qos" property
   * @param options Additional options
   *    - `tenantGroup` Name of the group for which the mappings should apply
   */
  registerQos (mappings: JSONObject, { tenantGroup='shared' }: { tenantGroup?: string } = {}) {
    const qos = this.definitions.has(tenantGroup)
      ? this.definitions.get(tenantGroup).qos || {}
      : {};

    qos.properties = { ...qos.properties, ...mappings }

    this.definitions.set(tenantGroup, { ...this.definitions.get(tenantGroup), qos });
  }

  /**
   * Define custom mappings for the "metadata" property
   *
   * @param mappings Mappings definition of the "metadata" property
   * @param options Additional options
   *    - `tenantGroup` Name of the group for which the mappings should apply
   */
  registerMetadata (mappings: JSONObject, { tenantGroup='shared' }: { tenantGroup?: string } = {}) {
    const metadata = this.definitions.has(tenantGroup)
      ? this.definitions.get(tenantGroup).metadata || {}
      : {};

    metadata.properties = { ...metadata.properties, ...mappings }

    this.definitions.set(tenantGroup, { ...this.definitions.get(tenantGroup), metadata });
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
    const measures = this.definitions.has(tenantGroup)
      ? this.definitions.get(tenantGroup).measures || {}
      : {};

    measures.properties = {
      ...measures.properties,
      [measureName]: { ...mappings }
    };

    this.definitions.set(tenantGroup, { ...this.definitions.get(tenantGroup), measures });
  }
}
