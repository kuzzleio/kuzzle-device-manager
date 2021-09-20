import { JSONObject, PluginImplementationError } from 'kuzzle';

export class DeviceMappingsManager {
  private mappings: JSONObject;

  constructor (baseMappings: JSONObject) {
    this.mappings = JSON.parse(JSON.stringify(baseMappings));
  }

  /**
   * Register custom metadata for devices
   *
   * @param metadata Device custom metadata mappings
   *
   * @example
   *
   * plugin.devices.registerMetadata({
   *   serial: { type: 'keyword' },
   * });
   *
   */
  registerMetadata (metadata) {
    for (const [name, value] of Object.entries(metadata)) {
      this.mappings.properties.metadata.properties[name] = value;
    }
  }

  /**
   * Register custom QoS for devices
   *
   * @param qos Device custom QoS mappings
   *
   * @example
   *
   * plugin.devices.registerQoS({
   *   battery: { type: 'integer' },
   * });
   */
  registerQoS (qos: JSONObject) {
    for (const [name, value] of Object.entries(qos)) {
      this.mappings.properties.qos.properties[name] = value;
    }
  }

  /**
   * Register custom measure for devices mappings
   *
   * @param qos Device custom measure
   *
   * @example
   *
   * plugin.devices.registerMeasure('humidity', {
   *   value: { type: 'float' },
   * });
   */
  registerMeasure (name: string, measure: JSONObject) {
    if (this.mappings.properties.measures.properties[name]) {
      throw new PluginImplementationError(`Measure "${name}" already exists.`);
    }

    const newMeasure = {
      ...measure,
      payloadUuid: { type: 'keyword' },
      updatedAt: { type: 'date' },
    }

    this.mappings.properties.measures.properties[name] = {
      properties: newMeasure
    };
  }

  get (): JSONObject {
    return this.mappings;
  }
}
