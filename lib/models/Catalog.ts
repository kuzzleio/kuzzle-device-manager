import { JSONObject } from 'kuzzle';

import { ConfigDocument } from './Config';

export const catalogMappings = {
  dynamic: 'strict',

  properties: {
    assetId: { type: 'keyword' },

    authorized: { type: 'boolean' },

    deviceId: { type: 'keyword' },

    tenantId: { type: 'keyword' },
  },
};

/**
 * Provisioning catalog entry
 */
export type CatalogContent = {
  /**
   * ID of the device
   * (e.g. "Abeeway-123456")
   */
  deviceId: string;

  /**
   * If set to false, the device cannot register
   */
  authorized: boolean;

  /**
   * If set, the device will be attached to this tenant
   */
  tenantId?: string;

  /**
   * If set, the device will be linked to this asset
   */
  assetId?: string;
}

/**
 * Catalog configuration document
 */
export class Catalog extends ConfigDocument<CatalogContent> {
  /**
   * Can be build either:
   *   - with a raw config document (_id and _source properties)
   *   - with a rule definition
   */
  constructor (document: CatalogContent | { _id: string, _source: JSONObject }) {
    // eslint-disable-next-line dot-notation
    if (document['_id'] || document['_source']) {
      super(document as any);
    }
    else {
      super({
        _source: {
          catalog: document as CatalogContent,
          type: 'catalog'
        }
      });
    }
  }
}
