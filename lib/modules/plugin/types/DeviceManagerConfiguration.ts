import { CollectionMappings, JSONObject } from "kuzzle-sdk";

export type DeviceManagerConfiguration = {
  /**
   * Ignore errors at startup such as wrong mappings update.
   *
   * Useful to start the plugin even if the mappings are not up to date.
   */
  ignoreStartupErrors: boolean;

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
    // ! TODO next major release: pluralize the collection name
    asset: {
      name: string;
      mappings: CollectionMappings;
      settings?: JSONObject;
    };
    assetGroups: {
      name: string;
      settings?: JSONObject;
    };
    assetHistory: {
      name: string;
      settings?: JSONObject;
    };
    // ! TODO next major release: pluralize the collection name
    device: {
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
