import {
  ControllerDefinition,
  KuzzleRequest,
  PluginContext,
  PreconditionError
} from '../../../kuzzle';

// import { NativeController } from '../../node_modules/kuzzle/lib/api/controller/base.js'
import { NativeController } from '../../../kuzzle/lib/api/controller/base.js'
import { CRUDService } from '../services/CRUDService';

export class SensorController extends NativeController {
  [key: string]: any;

  private context: PluginContext;

  private crudService: CRUDService;

  public definition: ControllerDefinition

  get kuzzle (): any {
    return this.context['kuzzle'];
  }

  /**
   * Constructor
   * 
   * @param context 
   */
  constructor (context) {
    super(context['kuzzle']);

    this.context = context;

    this.crudService = new CRUDService(context, this, 'sensor');

    this.definition = {
      actions: {
        create: {
          handler: this.crudService.create.bind(this.crudService),
          http: [{ verb: 'post', path: 'device-manager/sensor/create' }]
        },
        delete: {
          handler: this.crudService.delete.bind(this.crudService),
          http: [{ verb: 'delete', path: 'device-manager/sensor' }]
        },
        list: {
          handler: this.crudService.list.bind(this.crudService),
          http: [{ verb: 'get', path: 'device-manager/sensor' }]
        },
        link: {
          handler: this.link.bind(this),
          http: [{ verb: 'post', path: 'device-manager/sensor/link' }]
        },
        unlink: {
          handler: this.unlink.bind(this),
          http: [{ verb: 'post', path: 'device-manager/sensor/unlink' }]
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
          match: {
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
   * Will also unlink the asset.
   * If it fails to unlink the asset then it will unlink the sensor.
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
          match: {
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
}