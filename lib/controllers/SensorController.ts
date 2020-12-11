import {
  ControllerDefinition,
  KuzzleRequest,
  PreconditionError,
} from 'kuzzle';

import { CRUDController } from './CRUDController';

export class SensorController extends CRUDController {
  public definition: ControllerDefinition;

  /**
   * Constructor
   * 
   * @param context 
   */
  constructor(context) {
    super(context, 'sensor');

    this.context = context;

    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ verb: 'post', path: 'device-manager/sensor/create' }]
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ verb: 'delete', path: 'device-manager/sensor' }]
        },
        search: {
          handler: this.search.bind(this),
          http: [{ verb: 'post', path: 'device-manager/sensor/search' }]
        },
        link: {
          handler: this.link.bind(this),
          http: [{ verb: 'post', path: 'device-manager/sensor/link' }]
        },
        unlink: {
          handler: this.unlink.bind(this),
          http: [{ verb: 'post', path: 'device-manager/sensor/unlink' }]
        },
        push: {
          handler: this.push.bind(this),
          http: [{ verb: 'post', path: 'device-manager/sensor/push'}]
        }
      }
    };
  }

  /**
   * Link a sensor to an asset.
   * Will also link the asset to the sensor.
   * If it fails to link the asset then it will unlink the sensor.
   * 
   * @param request 
   */
  async link(request: KuzzleRequest) {
    const index = this.getIndex(request);
    const assetId = this.getBodyString(request, 'assetId');
    const sensorId = this.getId(request);

    const asset = await this.context.accessors.sdk.document.search(
      index,
      'asset',
      {
        query: {
          term: {
            _id: assetId,
          },
        },
      }
    );
    if (asset.total === 0) {
      throw new PreconditionError(`The asset with id ${assetId} does not exits.`);
    }

    const res = await this.context.accessors.sdk.document.update(
      index,
      'sensor',
      sensorId,
      {
        assetId,
      },
      {
        refresh: this.getRefresh(request),
      }
    );

    try {
      // Update the asset as well
      await this.context.accessors.sdk.document.update(
        index,
        'asset',
        asset.hits[0]._id,
        {
          sensorId
        },
        {
          refresh: this.getRefresh(request),
        }
      );
    } catch (e) {
      // If the asset is not updated then rollback
      await this.context.accessors.sdk.document.update(
        index,
        'sensor',
        sensorId,
        {
          assetId: null
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
   * Unlink a sensor.
   * Will also unlink the sensor the asset is linked to.
   * If it fails to unlink the asset then it will link the sensor again.
   * 
   * @param request 
   */
  async unlink(request: KuzzleRequest) {
    const index = this.getIndex(request);
    const sensorId = this.getId(request);

    const asset = await this.context.accessors.sdk.document.search(
      index,
      'asset',
      {
        query: {
          term: {
            sensorId
          },
        },
      }
    );

    const res = await this.context.accessors.sdk.document.update(
      index,
      'sensor',
      sensorId,
      {
        assetId: null
      },
      {
        refresh: this.getRefresh(request),
      }
    );

    try {
      // Update the asset as well
      await this.context.accessors.sdk.document.update(
        index,
        'asset',
        asset.hits[0]._id,
        {
          sensorId: null
        },
        {
          refresh: this.getRefresh(request),
        }
      );
    } catch (e) {
      // If the asset is not updated then rollback
      await this.context.accessors.sdk.document.update(
        index,
        'sensor',
        sensorId,
        {
          assetId: asset.hits[0]._id
        },
        {
          refresh: this.getRefresh(request),
        }
      );
      throw e;
    }

    return res;
  }

  // eslint-disable-next-line
  push(request: Request) {
    // @TODO
  }
}