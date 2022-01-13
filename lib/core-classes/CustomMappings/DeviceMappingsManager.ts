import { JSONObject } from 'kuzzle';

import { MeasuresRegister } from '../MeasuresRegister';
import { devicesMappings } from '../../models';

export class DeviceMappingsManager {
  private measuresRegister: MeasuresRegister;
  private mappings: JSONObject;

  constructor (measuresRegister: MeasuresRegister) {
    this.mappings = JSON.parse(JSON.stringify(devicesMappings));
    this.measuresRegister = measuresRegister;
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
  registerMetadata (metadata: JSONObject) {
    for (const [name, value] of Object.entries(metadata)) {
      this.mappings.properties.metadata.properties[name] = value;
    }
  }

  get (): JSONObject {
    const mappings = JSON.parse(JSON.stringify(this.mappings));

    mappings.properties.measures = this.measuresRegister.getMappings();

    return mappings;
  }
}
