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

  models: {
    metadata: {
      /**
       * Only accept new metadata referenced from the metadata referential in the models written through the API.
       *
       * New inline metadataMappings keys are rejected, the inline metadata already defined
       * by a model are kept (legacy). Models registered from code are not affected.
       */
      referentialOnly: boolean;
    };
  };

  /**
   * Platform index name
   */
  platformIndex: string;

  /**
   * Collection mappings for the platform index
   */
  platformCollections: {
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
      mappings: CollectionMappings;
    };
  };
};
