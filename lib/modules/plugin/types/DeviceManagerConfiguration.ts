import { CollectionMappings, JSONObject } from "kuzzle-sdk";

export type DeviceManagerConfiguration = {
  /**
   * Ignore errors at startup such as wrong mappings update.
   *
   * Useful to start the plugin even if the mappings are not up to date.
   */
  ignoreStartupErrors: boolean;
  /**
   * Should be set to true to historize measures in asset-history collection (deprecated)
   *
   * Should be enabled only for backward compatibility because it leads to important performance costs.
   */
  assetsHistorizesMeasures: boolean;
  engine: {
    /**
     * Auto update collection mappings with models
     *
     * This can lead to huge pressure on the database at start if a lot
     * of engine are present.
     */
    autoUpdate: true;
  };

  /**
   * Administration index name
   */
  adminIndex: string;

  /**
   * Administration collections mappings (in admin index)
   */
  adminCollections: {
    config: {
      name: string;
      mappings: JSONObject;
      settings?: JSONObject;
    };

    devices: {
      name: string;
      mappings: JSONObject;
      settings?: JSONObject;
    };

    payloads: {
      name: string;
      mappings: JSONObject;
      settings?: JSONObject;
    };
  };

  engineCollections: {
    config: {
      name: string;
      mappings: JSONObject;
      settings?: JSONObject;
    };
    assets: {
      name: string;
      mappings: CollectionMappings;
      settings?: JSONObject;
    };
    groups: {
      name: string;
      mappings: CollectionMappings;
      settings?: JSONObject;
    };
    assetHistory: {
      name: string;
      settings?: JSONObject;
    };
    devices: {
      name: string;
      mappings: CollectionMappings;
      settings?: JSONObject;
    };
    measures: {
      name: string;
      settings?: JSONObject;
    };
  };
};
