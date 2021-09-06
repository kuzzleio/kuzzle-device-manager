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
   * @param mapping Mapping definiton of the "metadata" property
   * @param options Additional options
   *    - `tenantGroup` Name of the group for which the mapping should apply
   */
  registerMetadata (mapping: JSONObject, options: JSONObject = { tenantGroup: 'shared' }) {
    const tenantGroup = options.tenantGroup;
    
    this.definitions.set(tenantGroup, {
      ...this.definitions.get(tenantGroup),
      metadata: {
        dynamic: 'false',
        properties: {
          ...mapping
        }
      }
    });    
  }
}

export class DevicesCustomProperties {

  /**
   * Custom mappings for "devices" collection
   */
  public definitions: Map<string, JSONObject>;

  constructor(deviceMappings: JSONObject) {
    this.definitions = new Map<string, JSONObject>();

    // Initialize shared devices properties from default mappings
    this.definitions.set('shared', deviceMappings.properties);
  }

  /**
   * Define custom mappings for the "qos" property
   * 
   * @param mapping Mapping definiton of the "qos" property
   * @param options Additional options
   *    - `tenantGroup` Name of the group for which the mapping should apply
   */
  registerQos (mapping: JSONObject, options: JSONObject = { tenantGroup: 'shared' }) {
    const tenantGroup = options.tenantGroup;
    
    this.definitions.set(tenantGroup, {
      ...this.definitions.get(tenantGroup),
      qos: {
        dynamic: 'false',
        properties: {
          ...mapping
        }
      }
    });
  }

  /**
   * Define custom mappings for the "metadata" property
   * 
   * @param mapping Mapping definiton of the "metadata" property
   * @param options Additional options
   *    - `tenantGroup` Name of the group for which the mapping should apply
   */
  registerMetadata (mapping: JSONObject, options: JSONObject = { tenantGroup: 'shared' }) {
    const tenantGroup = options.tenantGroup;
    
    this.definitions.set(tenantGroup, {
      ...this.definitions.get(tenantGroup),
      metadata: {
        dynamic: 'false',
        properties: {
          ...mapping
        }
      }
    });
  }

  /**
   * Define custom mappings for the "measures" property
   * 
   * @param measureName Name of the measure property you mean to add (eg. 'temperature')
   * @param mapping Mapping definiton of the added measure property
   * @param options Additional options
   *    - `tenantGroup` Name of the group for which the mapping should apply
   */
  registerMeasure (measureName: string, mapping: JSONObject, options: JSONObject = { tenantGroup: 'shared' }) {
    const tenantGroup = options.tenantGroup;
    let properties;

    const group = this.definitions.get(tenantGroup);
    if (group) {
      properties = group.measures && group.measures.properties 
        ? group.measures.properties
        : undefined
    }
    this.definitions.set(tenantGroup, {
      ...this.definitions.get(tenantGroup),
      measures: {
        dynamic: 'false',
        properties: {
          ...properties,
          [measureName]: { ...mapping }
        }
      }
    });
  }
}
