import { JSONObject } from 'kuzzle';

export class AssetsCustomProperties {

  public definitions: Map<string, JSONObject>;

  constructor() {
    this.definitions = new Map<string, JSONObject>();
  }

  /**
   * Define custom mappings for "assets" collections
   */
  registerMetadata (mapping: JSONObject, tenantGroup: any = 'shared') {
    /**
     * Define custom mappings for the "metadata" property
     */
    this.definitions.set(tenantGroup, {
      ...this.definitions.get(tenantGroup),
      metadata: {
        properties: {
          ...mapping
        }
      }
    });    
  };
}

export class DeviceCustomProperties {

  public definitions: Map<string, JSONObject>;

  constructor() {
    this.definitions = new Map<string, JSONObject>();
  }
  /**
   * Define custom mappings for "devices" collections
   */
  registerQos (mapping: JSONObject, tenantGroup: any = 'shared') {
    this.definitions.set(tenantGroup, {
      ...this.definitions.get(tenantGroup),
      qos: {
        properties: {
          ...mapping
        }
      }
    });
  }

  registerMetadata (mapping: JSONObject, tenantGroup: any = 'shared') {
    this.definitions.set(tenantGroup, {
      ...this.definitions.get(tenantGroup),
      metadata: {
        properties: {
          ...mapping
        }
      }
    });
  }

  registerMeasures (mapping: JSONObject, tenantGroup: any = 'shared') {
    this.definitions.set(tenantGroup, {
      ...this.definitions.get(tenantGroup),
      measures: {
        properties: {
          ...mapping
        }
      }
    });
  }
}
