import { JSONObject } from 'kuzzle';

import { ConfigDocument } from './Config';

export const catalogMappings = {
  dynamic: 'strict',

  properties: {
    deviceId: { type: 'keyword' },

    authorized: { type: 'boolean' },

    tenantId: { type: 'keyword' },

    assetId: { type: 'keyword' },
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
    if (document['_id'] || document['_source']) {
      super(document as any)
    }
    else {
      super({
        _source: {
          type: 'catalog',
          catalog: document as CatalogContent
        }
      })
    }
  }
}
