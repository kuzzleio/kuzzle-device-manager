import _ from 'lodash';
import { JSONObject, PluginImplementationError } from 'kuzzle';

import { MeasuresRegister } from '../MeasuresRegister';
import { assetsMappings } from '../../models';

type AssetDefinition = {
  /** Asset name */
  name: string;

  /**
   * Asset group
   */
  group: string;

  /**
   * Asset metadata
   *
   * @example
   *
   * {
   *    size: { type: 'integer' },
   *    serial: { type: 'keyword' },
   * }
   */
  metadata:JSONObject;
}

export class AssetMappingsManager {
  private baseMappings: JSONObject;
  private measuresRegister: MeasuresRegister;

  private assetByName = new Map<string, AssetDefinition>();
  private assetByGroup = new Map<string, AssetDefinition[]>();

  constructor (measuresRegister: MeasuresRegister) {
    this.baseMappings = JSON.parse(JSON.stringify(assetsMappings));;
    this.measuresRegister = measuresRegister;

    this.assetByGroup.set('commons', []);
  }

  /**
   * Register an asset type with custom metadata.
   *
   * If a "group" is provided, this asset type metadata will only be injected when
   * creating an engine of the same group.
   *
   * @param name Asset type name
   * @param metadata Asset type custom metadata
   * @param options.group Only inject this asset type to engine of this group
   *
   * @example
   *
   * plugin.assets.register('container', {
   *   size: { type: 'integer' },
   *   serial: { type: 'keyword' },
   * });
   *
   */
  register (
    name: string,
    metadata: JSONObject,
    { group='commons' }: { group?: string } = {}
  ) {
    if (this.assetByName.has(name)) {
      throw new PluginImplementationError(`Asset of type "${name}" has already been registered.`);
    }

    const definition: AssetDefinition = {
      name,
      group,
      metadata,
    };

    this.assetByName.set(name, definition);

    if (! this.assetByGroup.has(group)) {
      this.assetByGroup.set(group, [])
    }

    this.assetByGroup.get(group).push(definition);
  }

  get (group = 'commons'): JSONObject {
    const mappings = JSON.parse(JSON.stringify(this.baseMappings));

    mappings.properties.measures.dynamic = 'false';

    mappings.properties.measures = this.measuresRegister.getMappings();

    if (this.assetByGroup.has('commons')) {
      for (const definition of this.assetByGroup.get('commons')) {
        mappings.properties.metadata.properties = _.merge(
          {},
          mappings.properties.metadata.properties,
          definition.metadata);
      }
    }

    if (group !== 'commons' && this.assetByGroup.has(group)) {
      for (const definition of this.assetByGroup.get(group)) {
        mappings.properties.metadata.properties = _.merge(
        {},
        mappings.properties.metadata.properties,
        definition.metadata);
      }
    }

    return mappings;
  }
}
