import { JSONObject } from "kuzzle";

export type DeviceManagerConfiguration = {
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
      settings: JSONObject;
    };

    devices: {
      name: string;
      mappings: JSONObject;
      settings: JSONObject;
    };

    payloads: {
      name: string;
      mappings: JSONObject;
      settings: JSONObject;
    };
  };

  engineCollections: {
    config: {
      name: string;
      mappings: JSONObject;
      settings: JSONObject;
    };
  };
};
