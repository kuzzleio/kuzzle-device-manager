import {
  ControllerDefinition,
  KuzzleRequest,
  PluginContext,
  PreconditionError
} from '../../../kuzzle';

// import { NativeController } from '../../node_modules/kuzzle/lib/api/controller/base.js'
import { NativeController } from '../../../kuzzle/lib/api/controller/base.js';
import { CRUDService } from '../services/CRUDService';

export class AssetController extends NativeController {
  [key: string]: any;

  private context: PluginContext;

  private crudService: CRUDService;

  public definition: ControllerDefinition;

  get kuzzle(): any {
    return this.context['kuzzle'];
  }

  /**
   * Constructor
   * 
   * @param context 
   */
  constructor(context) {
    super(context['kuzzle']);

    this.context = context;

    this.crudService = new CRUDService(context, this, 'asset');

    this.definition = {
      actions: {
        create: {
          handler: this.crudService.create.bind(this.crudService),
          http: [{ verb: 'post', path: 'device-manager/asset/create' }],
        },
        delete: {
          handler: this.crudService.delete.bind(this.crudService),
          http: [{ verb: 'delete', path: 'device-manager/asset' }],
        },
        list: {
          handler: this.crudService.list.bind(this.crudService),
          http: [{ verb: 'get', path: 'device-manager/asset' }],
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
          match: {
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
   * Will also unlink the sensor.
   * If it fails to unlink the sensor then it will unlink the asset.
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
          match: {
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
