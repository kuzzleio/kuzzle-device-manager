import _ from "lodash";
import { JSONObject, PluginImplementationError } from "kuzzle";

import { MeasuresRegister } from "./MeasuresRegister";

import { assetsMappings } from "../../modules/asset/collections/assetsMappings";

type AssetDefinition = {
  /**
   * Asset engine group
   */
  engineGroup: string;

  /**
   * Asset model
   */
  model: string;

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
  metadata: JSONObject;
};

export class AssetsRegister {
  private baseMappings: JSONObject;
  private measuresRegister: MeasuresRegister;

  private assetByName = new Map<string, AssetDefinition>();
  private assetByEngineGroup = new Map<string, AssetDefinition[]>();

  constructor(measuresRegister: MeasuresRegister) {
    this.baseMappings = JSON.parse(JSON.stringify(assetsMappings));
    this.measuresRegister = measuresRegister;

    this.assetByEngineGroup.set("commons", []);
  }

  /**
   * Register an asset type with custom metadata.
   *
   * If a "engineGroup" is provided, this asset type metadata will only be injected when
   * creating an engine of the same group.
   *
   * @param model Asset model name
   * @param metadata Asset type custom metadata
   * @param options.group Only inject this asset type to engine of this group
   *
   * ```js
   * plugin.assets.register('container', {
   *   size: { type: 'integer' },
   *   serial: { type: 'keyword' },
   * });
   * ```
   */
  register(
    model: string,
    metadata: JSONObject,
    { engineGroup = "commons" }: { engineGroup?: string } = {}
  ) {
    if (this.assetByName.has(model)) {
      throw new PluginImplementationError(
        `Asset of model "${model}" has already been registered.`
      );
    }

    const definition: AssetDefinition = {
      engineGroup,
      metadata,
      model,
    };

    this.assetByName.set(model, definition);

    if (!this.assetByEngineGroup.has(engineGroup)) {
      this.assetByEngineGroup.set(engineGroup, []);
    }

    this.assetByEngineGroup.get(engineGroup).push(definition);
  }

  getMappings(engineGroup = "commons"): JSONObject {
    const mappings = JSON.parse(JSON.stringify(this.baseMappings));

    mappings.properties.measures.dynamic = "false";

    mappings.properties.measures = this.measuresRegister.getMappings();

    if (this.assetByEngineGroup.has("commons")) {
      for (const definition of this.assetByEngineGroup.get("commons")) {
        mappings.properties.metadata.properties = _.merge(
          {},
          mappings.properties.metadata.properties,
          definition.metadata
        );
      }
    }

    if (engineGroup !== "commons" && this.assetByEngineGroup.has(engineGroup)) {
      for (const definition of this.assetByEngineGroup.get(engineGroup)) {
        mappings.properties.metadata.properties = _.merge(
          {},
          mappings.properties.metadata.properties,
          definition.metadata
        );
      }
    }

    return mappings;
  }
}
