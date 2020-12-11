import {
  ControllerDefinition,
  KuzzleRequest,
  PreconditionError,
} from 'kuzzle';

import { CRUDController } from './CRUDController';

export class AssetController extends CRUDController {
  public definition: ControllerDefinition;

  /**
   * Constructor
   * 
   * @param context 
   */
  constructor(context) {
    super(context, 'asset');

    this.context = context;

    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ verb: 'post', path: 'device-manager/asset/create' }],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/asset' }],
        },
        search: {
          handler: this.search.bind(this),
          http: [{ verb: 'post', path: 'device-manager/asset/search' }],
        },
        link: {
          handler: this.link.bind(this),
          http: [{ verb: 'post', path: 'device-manager/asset/link' }],
        },
        unlink: {
          handler: this.unlink.bind(this),
          http: [{ verb: 'post', path: 'device-manager/asset/unlink' }],
        },
      },
    };
  }

  /**
   * Link an asset to a sensor.
   * Will also link the sensor to the asset.
   * If it fails to link the sensor then it will unlink the asset.
   * 
   * @param request 
   */
  async link(request: KuzzleRequest) {
    const index = this.getIndex(request);
    const assetId = this.getId(request);
    const sensorId = this.getBodyString(request, 'sensorId');

    const sensor = await this.context.accessors.sdk.document.search(
      index,
      'sensor',
      {
        query: {
          term: {
            _id: sensorId,
          },
        },
      }
    );
    if (sensor.total === 0) {
      throw new PreconditionError(`The sensor with id ${sensorId} does not exits.`);
    }

    const res = await this.context.accessors.sdk.document.update(
      index,
      'asset',
      assetId,
      {
        sensorId,
      },
      {
        refresh: this.getRefresh(request),
      }
    );

    try {
      // Update the sensor as well
      await this.context.accessors.sdk.document.update(
        index,
        'sensor',
        sensor.hits[0]._id,
        {
          assetId
        },
        {
          refresh: this.getRefresh(request),
        }
      );
    } catch (e) {
      // If the sensor is not updated then rollback
      await this.context.accessors.sdk.document.update(
        index,
        'asset',
        assetId,
        {
          sensorId: null
        },
        {
          refresh: this.getRefresh(request),
        }
      );
      throw e;
    }

    return res;
  }

  /**
   * Unlink an asset.
   * Will also unlink the sensor the asset is linked to.
   * If it fails to unlink the sensor then it will link the asset again.
   * 
   * @param request 
   */
  async unlink(request: KuzzleRequest) {
    const index = this.getIndex(request);
    const assetId = this.getId(request);

    const sensor = await this.context.accessors.sdk.document.search(
      index,
      'sensor',
      {
        query: {
          term: {
            assetId
          },
        },
      }
    );

    const res = await this.context.accessors.sdk.document.update(
      index,
      'asset',
      assetId,
      {
        sensorId: null
      },
      {
        refresh: this.getRefresh(request),
      }
    );

    try {
      // Update the sensor as well
      await this.context.accessors.sdk.document.update(
        index,
        'sensor',
        sensor.hits[0]._id,
        {
          assetId: null
        },
        {
          refresh: this.getRefresh(request),
        }
      );
    } catch (e) {
      // If the sensor is not updated then rollback
      await this.context.accessors.sdk.document.update(
        index,
        'asset',
        assetId,
        {
          sensorId: sensor.hits[0]._id
        },
        {
          refresh: this.getRefresh(request),
        }
      );
      throw e;
    }

    return res;
  }
}
