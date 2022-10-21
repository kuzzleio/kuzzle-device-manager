import { JSONObject, PluginImplementationError } from "kuzzle";

import { MeasuresRegister } from "./MeasuresRegister";

import { devicesMappings } from "../../modules/device/collections/deviceMappings";

export class DevicesRegister {
  private mappings: JSONObject;
  private measuresRegister: MeasuresRegister;

  constructor(measuresRegister: MeasuresRegister) {
    this.mappings = JSON.parse(JSON.stringify(devicesMappings));
    this.measuresRegister = measuresRegister;
  }

  /**
   * Register custom metadata for devices
   *
   * @param metadata Device custom metadata mappings
   *
   * ```js
   * plugin.devices.registerMetadata({
   *   serial: { type: 'keyword' },
   * });
   * ```
   */
  registerMetadata(metadata: JSONObject) {
    for (const [name, value] of Object.entries(metadata)) {
      if (this.mappings.properties.metadata.properties[name]) {
        throw new PluginImplementationError(
          `Device metadata "${name}" already exists`
        );
      }

      this.mappings.properties.metadata.properties[name] = value;
    }
  }

  getMappings(): JSONObject {
    const mappings = JSON.parse(JSON.stringify(this.mappings));

    mappings.properties.measures = this.measuresRegister.getMappings();

    return mappings;
  }
}
